namespace WOL_ASPDotNet.Models.ViewModels
{
    public class WakeOnLanParam
    {
        /// <summary>
        /// The physical mac address
        /// </summary>
        public string macAddress { get; set; }

        /// <summary>
        /// Port number
        /// </summary>
        public ushort port { get; set; }
    }
}
