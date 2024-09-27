namespace WOL_ASPDotNet.Models.ViewModels
{
    public class HostInfo
    {
        public string IPv4 { get; set; }

        public string IPv6 { get; set; }

        public string Mac {  get; set; }

        public string HostName { get; set; }

        public DateTime CreateTime { get; set; }

        public DateTime? UpdateTime { get; set; }
    }
}
