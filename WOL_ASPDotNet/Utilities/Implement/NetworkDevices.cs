using System.Net.Sockets;
using SharpPcap.LibPcap;
using SharpPcap;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class NetworkDevices: INetworkDevices
    {
        public IEnumerable<DeviceInfo> getDeviceInfoList()
        {
            var devices = CaptureDeviceList.Instance
            .OfType<LibPcapLiveDevice>()
            .Cast<LibPcapLiveDevice>()
            //Only list the NICs with IPv4 settings
            .Where(x => x.Addresses.Any(y => y.Addr.ipAddress != null && y.Addr.ipAddress.AddressFamily == AddressFamily.InterNetwork))
            .Select(x => new DeviceInfo
            {
                ID = x.Name,
                Name = x.Description,
                FriendlyName = x.Interface.FriendlyName
            })
            .OrderBy(x => x.FriendlyName);

            return devices;
        }
    }
}
