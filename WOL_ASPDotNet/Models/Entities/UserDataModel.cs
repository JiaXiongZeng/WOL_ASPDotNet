namespace WOL_ASPDotNet.Models.Entities
{
    public class UserDataModel
    {
        public int UID { get; set; }

        public string LocalID { get; set; }

        public string LocalPWD { get; set; }

        public string OAuthID { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; }

        public string Phone { get; set; }

        public bool IsAdmin { get; set; }

        public string Status { get; set; }

        public DateTime? Createtime_LocalID { get; set; }

        public DateTime? Createtime_OAuthID { get; set; }

        public DateTime? Modifytime { get; set; }

        public DateTime? Deletetime { get; set; }
    }
}
