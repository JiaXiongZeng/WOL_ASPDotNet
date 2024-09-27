using SharpPcap;
using PacketDotNet;
using System.Net;
using System.Text.RegularExpressions;
using WOL_ASPDotNet.Utilities.Interface;
using System.Text;
using System.Net.NetworkInformation;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class ICMPUtility : NetworkTool, IICMPUtility
    {
        private IIdentifierGenerator _idGenerator;      
        private int _maximumTryail = 3;
        private int _timeout = 1000 * 10;  //10s

        //Locker for synchronization
        private object mapLocker = new object();

        //Requested packet info map
        private Dictionary<string, ICMPEchoInfo> map = new Dictionary<string, ICMPEchoInfo>();

        //Cancellation token sources
        private List<CancellationTokenSource> ctsList = new List<CancellationTokenSource>();

        //Current uncompleted tasks
        //private List<TaskCompletionSource<ICMPEchoInfo>> pingTasks = new List<TaskCompletionSource<ICMPEchoInfo>>();

        public ICMPUtility(IIdentifierGenerator idGenerator): base()
        {
            this._idGenerator = idGenerator;
        }

        /// <summary>
        /// 初始化Tool
        /// </summary>
        public override void Reset()
        {
            base.Reset();

            //Cancel all tasks and clear CancellationTokenSource list
            while (ctsList.Count() > 0)
            {
                var cts = ctsList.FirstOrDefault();
                if (cts != null)
                {
                    try
                    {
                        cts.Cancel();
                    }
                    catch (Exception e)
                    {
                        //Do nothing
                    }
                    finally
                    {
                        ctsList.Remove(cts);
                    }
                }
            }
            ctsList.Clear();

            //Clear packet info map
            this.map.Clear();

            //Relese all occupied ids
            this._idGenerator.RemoveAll();
        }

        /// <summary>
        /// 設定捕捉封包來源的網路裝置
        /// </summary>
        /// <param name="keyword"></param>
        public override void SetDevice(string keyword = null)
        {
            base.SetDevice(keyword);
            _device.OnPacketArrival += (sender, args) => {
                //Just for initialization
                //Debug.WriteLine("Called");
            };
        }

        public override void StartCapture()
        {
            base.StartCaptureWithFilter("icmp");
        }

        /// <summary>
        /// Try to check whether the host (internal) is pingable or not
        /// </summary>
        /// <returns></returns>
        public async Task<ICMPEchoInfo> PingInternal(string IPv4, string macAddress)
        {
            if (!CheckIPv4IsValid(IPv4))
            {
                throw new ArgumentException("Invalid IPv4");
            }

            if (!CheckMacAddressIsValid(macAddress))
            {
                throw new ArgumentException("Invalid mac address");
            }

            if (this._device == null)
            {
                throw new InvalidOperationException("Device is not set");
            }

            // Get the local IP address and subnet mask
            //var ipHostEntry = Dns.GetHostEntry(Dns.GetHostName());
            //var ipSrc = ipHostEntry.AddressList[0]; // Choose the first IP address
            //var ipDest = IPAddress.Parse(IPv4);

            var ipSrc = GetNicIpv4Address();
            var ipDest = IPAddress.Parse(IPv4);

            var macSrc = this._device.MacAddress;
            var macDest = PhysicalAddress.Parse(macAddress);

            bool loopbackMode = false;
            if (IPv4 == ipSrc.ToString() || macSrc == null)
            {
                ////It seems no necessary to depart the loopback mode and common network mode
                ////It's meaningless for using ICMP echo mechanism to check if the host self alive

                //loopbackMode = true;
                //this.SetDevice("loopback;lo");
                //if (!this.IsStarted)
                //{
                //    this.StartCapture();
                //}

                ////Make a dummy response
                return new ICMPEchoInfo
                {
                    RequestTime = DateTime.Now,
                    ResponseTime = DateTime.Now
                };
            }


            int tryailCount = 0;
            var icmpID = _idGenerator.Generate();
            while (tryailCount++ < this._maximumTryail)
            {
                var icmpPacket = new ICMPEchoPacket
                {
                    Type = 8, //ICMP Echo Request (8)
                    Code = 0,
                    Identifier = icmpID,
                    SequenceNumber = (ushort)(tryailCount & 0x00FF),
                    Data = "Hello"
                };

                var ipPacket = new IPv4Packet(ipSrc, ipDest)
                {
                    Id = _idGenerator.Generate(),
                    TimeToLive = 128,
                    Protocol = ProtocolType.Icmp,
                    PayloadPacket = new IcmpV4Packet(new PacketDotNet.Utils.ByteArraySegment(icmpPacket.GetBytes()))
                };

                ipPacket.Checksum = ipPacket.CalculateIPChecksum();


                EthernetPacket etherPacket = null;
                if (loopbackMode)
                {
                    var loopbackPacket = new byte[] { 0x02, 0x00, 0x00, 0x00 };
                    loopbackPacket = loopbackPacket.Concat(ipPacket.Bytes).ToArray();

                    etherPacket = new EthernetPacket(new PacketDotNet.Utils.ByteArraySegment(loopbackPacket));
                }
                else
                {
                    etherPacket = new EthernetPacket(macSrc, macDest, EthernetType.IPv4)
                    {
                        PayloadPacket = ipPacket
                    };
                }

                var requestInfo = new ICMPEchoInfo
                {
                    IpIdentifier = ipPacket.Id,
                    IpAddress = ipPacket.DestinationAddress.ToString(),
                    IcmpIdentifier = icmpPacket.Identifier,
                    SequenceNumber = icmpPacket.SequenceNumber,
                    RequestTime = DateTime.Now
                };

                //Put echo info into map
                string key = combineToUniqueMapId(requestInfo.IpAddress, requestInfo.IpIdentifier, requestInfo.IcmpIdentifier, requestInfo.SequenceNumber);
                lock (this.mapLocker)
                {
                    //Maybe some un-expectable entry added (Timeout or Cancelled)
                    if(!this.map.TryAdd(key, requestInfo))
                    {
                        this.map.Remove(key);
                        this.map.TryAdd(key, requestInfo);
                    }
                }

                //Send ping request
                var responseInfo = await SendPacketAsync(etherPacket, requestInfo);

                //Remove echo info from map
                lock (this.mapLocker)
                {
                    this.map.Remove(key);
                }

                if (responseInfo != null)
                {
                    return responseInfo;
                }
            }

            return null;
        }

        private async Task<ICMPEchoInfo> SendPacketAsync(Packet packet, ICMPEchoInfo reqInfo)
        {
            var tcs = new TaskCompletionSource<ICMPEchoInfo>();

            var cts = new CancellationTokenSource();
            cts.CancelAfter(this._timeout);

            cts.Token.Register(() =>
            {
                if (cts.Token.IsCancellationRequested)
                {
                    tcs.TrySetCanceled(cts.Token);
                    return;
                }

                tcs.TrySetException(new TimeoutException(
                    $"Operation took more than {this._timeout} to complete"
                ));
            });

            this.ctsList.Add(cts);

            //Create new callback
            PacketArrivalEventHandler callback = null;
            callback = (sender, e) =>
            {
                var packet = Packet.ParsePacket(e.GetPacket().LinkLayerType, e.GetPacket().Data);

                var ipPacket = packet.Extract<IPPacket>();

                if (ipPacket != null && ipPacket.HasPayloadPacket)
                {
                    var icmpv4Packet = ipPacket.PayloadPacket as IcmpV4Packet;
                    if (icmpv4Packet.TypeCode == IcmpV4TypeCode.EchoReply)
                    {
                        ushort icmpIdBEorLE = icmpv4Packet.Id;
                        ushort icmpSnBEorLE = icmpv4Packet.Sequence;

                        ICMPEchoInfo info = null;
                        lock (this.mapLocker)
                        {
                            //Little endian one
                            string ipAddress = ipPacket.SourceAddress.ToString();
                            string key = combineToUniqueMapId(ipAddress, reqInfo.IpIdentifier, icmpIdBEorLE, icmpSnBEorLE);
                            if (map.ContainsKey(key) && map[key].SequenceNumber == icmpSnBEorLE)
                            {
                                info = map[key];
                            }

                            //If id & sequence is Big endian, converting to little endian
                            ushort icmpIdLE = ConvertBEtoLE(icmpIdBEorLE);
                            ushort icmpSnLE = ConvertBEtoLE(icmpSnBEorLE);
                            key = combineToUniqueMapId(ipAddress, reqInfo.IpIdentifier, icmpIdLE, icmpSnLE);
                            if (map.ContainsKey(key) && map[key].SequenceNumber == icmpSnLE)
                            {
                                info = map[key];
                            }

                            if (info != null)
                            {
                                info.ResponseTime = DateTime.Now;
                                this._device.OnPacketArrival -= callback;
                                tcs.TrySetResult(info);
                            }
                        }
                    }
                }
            };

            this._device.OnPacketArrival += callback;
            this._device.SendPacket(packet);

            // Wait for ICMP echo response or timeout
            try
            {
                var result = await tcs.Task;
                if (tcs.Task.IsCompleted)
                {
                    this._idGenerator.RemoveOldIdentifier(result.IpIdentifier);
                    this._idGenerator.RemoveOldIdentifier(result.IcmpIdentifier);
                    this.ctsList.Remove(cts);
                    return result;
                }
            }
            catch(Exception e)
            {
                //Do nothing
            }

            //Timeout or Cancelled
            reqInfo.IsTimeout = true;
            this._idGenerator.RemoveOldIdentifier(reqInfo.IpIdentifier);
            this._idGenerator.RemoveOldIdentifier(reqInfo.IcmpIdentifier);
            try
            {
                //The device may reset from out
                if (this._device != null)
                {
                    this._device.OnPacketArrival -= callback;
                }
            }
            catch(Exception e)
            {
                //Do nothing
            }
            this.ctsList.Remove(cts);
            return reqInfo;
        }

        /// <summary>
        /// Generate a map unique id for ping request
        /// </summary>
        /// <param name="IPAddress">IP address</param>
        /// <param name="requestId">The Id for this request</param>
        /// <param name="icmpId">The ICMP Id of the packet</param>
        /// <param name="icmpSeq">The ICMP sequence no. of the packet</param>
        /// <returns></returns>
        private string combineToUniqueMapId(string IPAddress, ushort requestId, ushort icmpId, ushort icmpSeq)
        {
            return $"{IPAddress}-{requestId}-{icmpId}-{icmpSeq}";
        }

        /// <summary>
        /// 設定最大嘗試次數
        /// </summary>
        /// <param name="maximumTryail">最大嘗試次數 (預設值: 1)</param>
        public void SetMaximumTryail(int maximumTryail = 1)
        {
            this._maximumTryail = maximumTryail;
        }

        /// <summary>
        /// 設定詢問的Timeout時間
        /// </summary>
        /// <param name="millisecs">毫秒 (預設值: 10000 i.e. 10秒鐘)</param>
        public void SetTimeout(int millisecs = 10000)
        {
            this._timeout = millisecs;
        }

        /// <summary>
        /// 計算Checksum驗證數
        /// </summary>
        /// <param name="packet"></param>
        /// <returns></returns>
        public static ushort CalculateChecksum(byte[] packet)
        {
            uint sum = 0;
            int length = packet.Length;

            // Add 16-bit words
            for (int i = 0; i < length; i += 2)
            {
                if (i + 1 < length)
                {
                    sum += (uint)((packet[i] << 8) | packet[i + 1]);
                }
                else
                {
                    sum += (uint)(packet[i] << 8);
                }
            }

            // Add overflow bits
            while ((sum >> 16) != 0)
            {
                sum = (sum & 0xFFFF) + (sum >> 16);
            }

            // One's complement
            return (ushort)~sum;
        }

        static ushort ConvertBEtoLE(ushort bigEndianValue)
        {
            // Extract bytes from the ushort value
            byte msb = (byte)(bigEndianValue >> 8); // Most Significant Byte
            byte lsb = (byte)(bigEndianValue & 0xFF); // Least Significant Byte

            // Swap bytes to convert to Little Endian
            ushort littleEndianValue = (ushort)((lsb << 8) | msb);

            return littleEndianValue;
        }

        private bool CheckIPv4IsValid(string IPv4)
        {
            bool result = false;
            var pattern = @"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$";
            var match = Regex.Match(IPv4, pattern);

            if (match.Success)
            {
                var part1 = match.Groups[1].Value;
                var part2 = match.Groups[2].Value;
                var part3 = match.Groups[3].Value;
                var part4 = match.Groups[4].Value;
                var parts = new List<string> { part1, part2, part3, part4 };
                result = !parts.Any(p => int.TryParse(p, out int digit) && (digit < 0 || digit > 255));
            }

            return result;
        }

        private bool CheckMacAddressIsValid(string macAddress)
        {
            var pattern = @"^(?:(?:[\da-f]{2})[:-]){5}[\da-f]{2}$";
            var match = Regex.Match(macAddress, pattern, RegexOptions.IgnoreCase);
            return match.Success;
        }
    }

    public class ICMPEchoPacket
    {
        /// <summary>
        /// Type (8: Echo ping Request, 0: Echo ping Reply)
        /// </summary>
        public byte Type { get; set; }

        /// <summary>
        /// Code (default 0)
        /// </summary>
        public byte Code { get; set; }

        /// <summary>
        /// Checksum
        /// </summary>
        public ushort Checksum { get; private set; }

        /// <summary>
        /// Identifier
        /// </summary>
        public ushort Identifier { get; set; }

        /// <summary>
        /// Sequence number
        /// </summary>
        public ushort SequenceNumber { get; set; }

        /// <summary>
        /// Data
        /// </summary>
        public string Data { get; set; }

        public ICMPEchoPacket() { }

        public ICMPEchoPacket(byte[] bytes)
        {

            this.Type = bytes[0];
            this.Code = bytes[1];
            this.Checksum = BitConverter.ToUInt16(bytes.Skip(2).Take(2).ToArray());
            this.Identifier = BitConverter.ToUInt16(bytes.Skip(4).Take(2).ToArray());
            this.SequenceNumber = BitConverter.ToUInt16(bytes.Skip(6).Take(2).ToArray());
            this.Data = Encoding.ASCII.GetString(bytes.Skip(8).ToArray());
        }

        public byte[] GetBytes()
        {
            using(var ms = new MemoryStream())
            {
                //Fixed part
                ms.Append(Type);
                ms.Append(Code);
                ms.Append(BitConverter.GetBytes((Checksum = 0x0000)));
                ms.Append(BitConverter.GetBytes(Identifier));
                ms.Append(BitConverter.GetBytes(SequenceNumber));
                //Variable part
                if (!string.IsNullOrEmpty(Data))
                {
                    ms.Append(Encoding.ASCII.GetBytes(Data));
                }

                var data = ms.ToArray();
                ushort checksum = ICMPUtility.CalculateChecksum(data);

                //Populate checksum
                data[2] = (byte)(checksum >> 8);
                data[3] = (byte)(checksum & 0x00FF);

                this.Checksum = checksum;

                return data;
            }
        }
    }

    public class ICMPEchoInfo
    {
        /// <summary>
        /// ip packet identifier
        /// </summary>
        public ushort IpIdentifier { get; set; }

        /// <summary>
        /// IP Address
        /// </summary>
        public string IpAddress { get; set; }

        /// <summary>
        /// Echo ping request icmp packet identifier
        /// </summary>
        public ushort IcmpIdentifier { get; set; }

        /// <summary>
        /// The sequence number binded to specific identifier
        /// </summary>
        public ushort SequenceNumber { get; set; }

        /// <summary>
        /// The request time
        /// </summary>
        public DateTime RequestTime { get; set; }

        /// <summary>
        /// The response time
        /// </summary>
        public DateTime ResponseTime { get; set; }

        /// <summary>
        /// The ping request is timeout
        /// </summary>
        public bool IsTimeout { get; set; }
    }
}
