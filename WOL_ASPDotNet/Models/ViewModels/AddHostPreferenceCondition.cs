namespace WOL_ASPDotNet.Models.ViewModels
{
    public class AddHostPreferenceCondition
    {
        public string MacAddress { get; set; }

        public bool? RDP_Wallpaper { get; set; }

        public bool? RDP_Theming { get; set; }

        public bool? RDP_FontSmoothing { get; set; }

        public bool? RDP_FullWindowDrag { get; set; }

        public bool? RDP_DesktopComposition { get; set; }

        public bool? RDP_MenuAnimations { get; set; }

        public string CreateId { get; set; }

        public DateTime? CreateDatetime { get; set; }
    }
}
