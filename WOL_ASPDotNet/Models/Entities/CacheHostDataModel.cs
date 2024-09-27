namespace WOL_ASPDotNet.Models.Entities
{
    public class CacheHostDataModel
    {
        public string HostName { get; set; }

        public string MacAddress { get; set; }

        public string IPv4 { get; set; }

        public string IPv6 { get; set; }

        public DateTime CreateDatetime { get; set; }

        public DateTime? UpdateDatetime { get; set; }
    }
}
