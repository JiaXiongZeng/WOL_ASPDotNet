using PacketDotNet;
using SharpPcap;
using SharpPcap.LibPcap;
using System.Net.NetworkInformation;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class WolUtility : NetworkTool, IWolUtility
    {
        private object _locker = new object();

        public WolUtility(): base() { }

        /// <summary>
        /// 喚醒指定實體位置的PC
        /// </summary>
        /// <param name="info">The info model</param>
        public async Task WakeUpAsync(WakeOnLanInfo info)
        {
            await Task.Yield();

            lock (this._locker)
            {
                this._device.Open(DeviceModes.Promiscuous, 1000); //(DeviceModes.NoCaptureRemote | DeviceModes.NoCaptureLocal);

                var srcMacAddress = this._device.MacAddress;
                //Dont specify the macAddress because brocast method is more common.
                //The unicast one may not be supported by the device.
                //var destMacAddress = info.macAddress;
                var destMacAddress = PhysicalAddress.Parse("ff:ff:ff:ff:ff:ff");
                var magicPacket = CreateMagicPacket(info.macAddress.GetAddressBytes());

                Packet wolPacket = null;
                if (info.port == 9)
                {
                    wolPacket = new EthernetPacket(srcMacAddress, destMacAddress, EthernetType.WakeOnLan)
                    {
                        PayloadData = magicPacket
                    };
                }
                else
                {
                    var udpPacket = new UdpPacket(9, info.port)
                    {
                        PayloadData = magicPacket
                    };

                    wolPacket = new EthernetPacket(srcMacAddress, destMacAddress, EthernetType.WakeOnLan)
                    {
                        PayloadPacket = udpPacket
                    };
                }

                this._device.SendPacket(wolPacket);
                this._device.Close();
            }
        }

        /// <summary>
        /// 產生Magic Packet
        /// </summary>
        /// <param name="macAddressBytes">Mac Address Bytes</param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        private byte[] CreateMagicPacket(byte[] macAddressBytes)
        {
            if (macAddressBytes.Length != 6)
                throw new ArgumentException("Invalid MAC address length. It must be 6 bytes long.");

            // Magic Packet consists of 6 bytes of 0xFF followed by 16 repetitions of the MAC address
            byte[] magicPacket = new byte[6 + 16 * macAddressBytes.Length];

            // Fill the first 6 bytes with 0xFF
            for (int i = 0; i < 6; i++)
            {
                magicPacket[i] = 0xFF;
            }

            // Fill the rest with 16 repetitions of the MAC address
            for (int i = 0; i < 16; i++)
            {
                Array.Copy(macAddressBytes, 0, magicPacket, 6 + i * macAddressBytes.Length, macAddressBytes.Length);
            }

            return magicPacket;
        }
    }
}
