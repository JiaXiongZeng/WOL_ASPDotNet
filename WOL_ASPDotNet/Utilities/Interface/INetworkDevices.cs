using SharpPcap;
using WOL_ASPDotNet.Models.ViewModels;

namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface INetworkDevices
    {
        public IEnumerable<DeviceInfo> getDeviceInfoList();
    }
}
