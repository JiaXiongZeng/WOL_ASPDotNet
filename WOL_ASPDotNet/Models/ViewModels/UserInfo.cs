﻿namespace WOL_ASPDotNet.Models.ViewModels
{
    public class UserInfo
    {
        public string LocalID { get; set; }

        public string OAuthID { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; }

        public string Phone { get; set; }

        public bool IsAdmin { get; set; }

        public string Status { get; set; }
    }
}