using System.Net.NetworkInformation;

namespace WOL_ASPDotNet.Models.ViewModels
{
    public class WakeOnLanInfo
    {
        /// <summary>
        /// The physical mac address
        /// </summary>
        public PhysicalAddress macAddress { get; set; }
        
        /// <summary>
        /// Port number
        /// </summary>
        public ushort port { get; set; }
    }
}
