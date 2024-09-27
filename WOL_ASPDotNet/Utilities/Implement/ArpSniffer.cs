using System.Net;
using System.Net.NetworkInformation;
using PacketDotNet;
using SharpPcap;
using WOL_ASPDotNet.Utilities.Interface;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class ArpSniffer : NetworkTool, IArpSniffer
    {
        private ICacheHostRepository _cacheHostRep;
        private IConfigurationRepository _configRep;
        private Dictionary<string, HostInfo> _hostList = new Dictionary<string, HostInfo>();

        public Dictionary<string, HostInfo> hostList
        {
            get
            {
                return _hostList;
            }
        }

        public ArpSniffer
            (
                ICacheHostRepository cacheHostRep,
                IConfigurationRepository configRep
            ): base()
        {
            this._cacheHostRep = cacheHostRep;
            this._configRep = configRep;
            this.ReloadFromDBCache();
        }

        /// <summary>
        /// 重開機後從資料庫載回Host快取
        /// </summary>
        private void ReloadFromDBCache()
        {
            var dbCaches = this._cacheHostRep.GetValidOnes().GetAwaiter().GetResult();
            this._hostList.Clear();
            foreach (var dbCache in dbCaches) {
                this._hostList.Add(dbCache.MacAddress, new HostInfo
                {
                    Mac = dbCache.MacAddress,
                    HostName = dbCache.HostName,
                    IPv4 = dbCache.IPv4,
                    IPv6 = dbCache.IPv6,
                    CreateTime = dbCache.CreateDatetime,
                    UpdateTime = dbCache.UpdateDatetime
                });
            }
        }

        public async Task<int> DeleteExpiredEntries(TimeSpan? expireDuration = null)
        {
            //Retrieve cache expiration timespan from config table
            if (expireDuration == null)
            {
                expireDuration = await this._configRep.GetCacheExpirationTimepsan();
            }

            DateTime dueDate = DateTime.Now - expireDuration.Value;
            var validOnes = this._hostList.Values.Where(x => (x.UpdateTime ?? x.CreateTime) > dueDate);

            int totalNum = this._hostList.Count;
            this._hostList.Clear();
            foreach (var item in validOnes)
            {
                this._hostList.Add(item.Mac, item);
                totalNum--;
            }

            return totalNum;
        }

        /// <summary>
        /// 初始化Tool
        /// </summary>
        public override void Reset()
        {
            base.Reset();

            //Don't delete immediately.
            //Because there will be still some packets captrued in the Reset period.
            Task.Run(async () =>
            {
                //Wait 5 minutes
                await Task.Delay(5000);

                //Clear db cache
                int delCount = await this._cacheHostRep.Delete();

                //Clear in-memory cache                
                this._hostList.Clear();
            });
        }

        /// <summary>
        /// 設定綁定的網卡
        /// </summary>
        /// <param name="keyword">網卡識別關鍵字</param>
        public override void SetDevice(string keyword = null)
        {
            base.SetDevice(keyword);            
            _device.OnPacketArrival += OnPacketArrival;
        }

        /// <summary>
        /// 開始捕捉封包
        /// </summary>
        public override void StartCapture()
        {
            base.StartCaptureWithFilter("arp");
        }

        /// <summary>
        /// To query specific MAC address of IPv4 on the same subnet
        /// </summary>
        /// <param name="targetIpAddress"></param>
        private void SendArpRequest(IPAddress targetIpAddress)
        {
            // Get the local IP address
            //var ipHostEntry = Dns.GetHostEntry(Dns.GetHostName());
            //var ipAddress = ipHostEntry.AddressList[0]; // Choose the first IP address

            var ipAddress = GetNicIpv4Address();

            // Create an ARP request packet
            var arpPacket = new ArpPacket(
                operation: ArpOperation.Request,
                // Sender MAC address
                senderHardwareAddress: _device.MacAddress,
                // Sender IP address
                senderProtocolAddress: ipAddress,
                // Target MAC address (broadcast)
                targetHardwareAddress: PhysicalAddress.Parse("00-00-00-00-00-00"),
                // Target IP address
                targetProtocolAddress: targetIpAddress
            );

            // Create an Ethernet packet to encapsulate the ARP request
            var ethernetPacket = new EthernetPacket(
                // Source MAC address
                sourceHardwareAddress: _device.MacAddress,
                // Destination MAC address (broadcast)
                destinationHardwareAddress: PhysicalAddress.Parse("FF-FF-FF-FF-FF-FF"),
                // Ethernet type (ARP)
                ethernetType: EthernetType.Arp
            )
            {
                PayloadPacket = arpPacket
            };

            // Send the Ethernet packet
            _device.SendPacket(ethernetPacket);
        }

        /// <summary>
        /// Get the subnet mask for a given IP address
        /// </summary>
        /// <param name="ipAddress">Specific IP address</param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        private byte[] GetSubnetMask(IPAddress ipAddress)
        {
            foreach (NetworkInterface adapter in NetworkInterface.GetAllNetworkInterfaces())
            {
                foreach (UnicastIPAddressInformation unicastIpAddress in adapter.GetIPProperties().UnicastAddresses)
                {
                    if (unicastIpAddress.Address.Equals(ipAddress))
                    {
                        return unicastIpAddress.IPv4Mask.GetAddressBytes();
                    }
                }
            }
            throw new ArgumentException("Subnet mask not found for the given IP address.");
        }

        /// <summary>
        /// To query all MAC addresses of IPv4 on the same subnet
        /// </summary>
        public void SendArpBroadcast()
        {
            // Get the local IP address and subnet mask
            //var ipHostEntry = Dns.GetHostEntry(Dns.GetHostName());
            //var ipAddress = ipHostEntry.AddressList[0]; // Choose the first IP address
            //var subnetMask = GetSubnetMask(ipAddress);

            var ipAddress = GetNicIpv4Address();
            var subnetMask = GetSubnetMask(ipAddress);

            // Extract network portion of IP address
            var networkBytes = new byte[4];
            for (int i = 0; i < 4; i++)
            {
                networkBytes[i] = (byte)(ipAddress.GetAddressBytes()[i] & subnetMask[i]);
            }

            // Get the valid records from cached host list
            var validCacheHosts = this._cacheHostRep.GetValidOnes().GetAwaiter().GetResult();

            // Sync memory cache from DB cache
            foreach (var host in validCacheHosts)
            {
                if (!this._hostList.Keys.Contains(host.MacAddress))
                {
                    this._hostList.Add(host.MacAddress, new HostInfo
                    {
                        Mac = host.MacAddress,
                        IPv4 = host.IPv4,
                        IPv6 = host.IPv6,
                        HostName = host.HostName,
                        CreateTime = host.CreateDatetime,
                        UpdateTime = host.UpdateDatetime
                    });
                }
                else
                {
                    var theEntry = this._hostList[host.MacAddress];
                    theEntry.Mac = host.MacAddress;
                    theEntry.IPv4 = host.IPv4;
                    theEntry.IPv6 = host.IPv6;
                    theEntry.HostName = host.HostName;
                    theEntry.CreateTime = host.CreateDatetime;
                    theEntry.UpdateTime = host.UpdateDatetime;
                }                
            }

            // Iterate over all IP addresses in the local subnet
            // If the IP exists in cache, don't try to broadcast again.
            var validIPv4Addrs = validCacheHosts.Select(x => x.IPv4);
            for (int i = 1; i <= 254; i++) // Assuming /24 subnet
            {
                var IPv4Bytes = new byte[] { networkBytes[0], networkBytes[1], networkBytes[2], (byte)i };

                if (!validIPv4Addrs.Contains(string.Join(".", IPv4Bytes)))
                {
                    var targetIpAddress = new IPAddress(IPv4Bytes);
                    SendArpRequest(targetIpAddress);
                }
            }
        }        

        private void OnPacketArrival(object sender, PacketCapture e)
        {
            var packet = Packet.ParsePacket(e.GetPacket().LinkLayerType, e.GetPacket().Data);
            if (packet.PayloadPacket is ArpPacket arpPacket && arpPacket.Operation == ArpOperation.Response)
            {
                var mac = arpPacket.SenderHardwareAddress.ToString();
                string IPv4 = arpPacket.SenderProtocolAddress.ToString();
                string hostName = GetHostNameByIPv4(IPv4);


                //Normalized the Mac address to human readable one
                mac = NetAddressUtility.FormatMacAddress(mac);

                //Add new entry
                if (!_hostList.ContainsKey(mac))
                { 
                    this._hostList.Add(mac, new HostInfo
                    {
                        IPv4 = IPv4,
                        Mac = mac,
                        HostName = hostName,
                        CreateTime = DateTime.Now
                    });
                }
                //Update old entry
                else
                {
                    var theEntry = _hostList[mac];
                    theEntry.IPv4 = IPv4;
                    theEntry.HostName = hostName;
                    theEntry.UpdateTime = DateTime.Now;
                }
            }
        }

        private string GetHostNameByIPv4(string IPv4)
        {
            string hostName = null;
            try
            {
                var entry = Dns.GetHostEntry(IPv4);
                if (entry != null)
                {
                    hostName = entry.HostName;
                }
            }
            catch
            {
                //Do nothing
            }

            return hostName;
        }
    }
}
