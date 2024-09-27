namespace WOL_ASPDotNet.Models.ViewModels
{
    public class UpdateHostInfo
    {
        public string MacAddress { get; set; }

        public string IPv4 { get; set; }

        public string HostName { get; set; }

        public string Domain { get; set; }

        public int WOL_Port { get; set; }

        public DateTime? UpdateTime { get; set; }
    }
}
