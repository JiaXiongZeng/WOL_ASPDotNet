namespace WOL_ASPDotNet.Models.ViewModels
{
    public class PutHostCredentialViewModel
    {
        public string MacAddress { get; set; }

        public int? RDP_Port { get; set; }

        public string RDP_Domain { get; set; }

        public string RDP_UserName { get; set; }

        public string RDP_Password { get; set; }

        public int? SSH_Port { get; set; }

        public string SSH_UserName { get; set; }

        public string SSH_Password { get; set; }

        public int? VNC_Port { get; set; }

        public string VNC_UserName { get; set; }

        public string VNC_Password { get; set; }
    }
}
