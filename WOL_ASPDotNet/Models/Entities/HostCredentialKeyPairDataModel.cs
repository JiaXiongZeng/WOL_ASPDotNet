namespace WOL_ASPDotNet.Models.Entities
{
    public class HostCredentialKeyPairDataModel
    {
        public string MacAddress { get; set; }

        public string PrivateKey { get; set; }

        public string PublicKey { get; set; }

        public string CreateId { get; set; }

        public DateTime? CreateDatetime { get; set; }

        public string UpdateId { get; set; }

        public DateTime? UpdateDatetime { get; set; }
    }
}
