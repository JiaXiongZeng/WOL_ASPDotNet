namespace WOL_ASPDotNet.Models.Entities
{
    public class HostDataModel
    {
        public long ID { get; set; }

        public string HostName { get; set; }

        public string Domain { get; set; }

        public string IPv4 { get; set; }

        public string IPv6 { get; set; }

        public string MacAddress {  get; set; }

        public int WOL_Port { get; set; }

        public int SN { get; set; }

        public string CreateId { get; set; }

        public DateTime? CreateDatetime { get; set; }

        public string UpdateId { get; set; }

        public DateTime? UpdateDatetime { get; set;}
    }
}
