namespace WOL_ASPDotNet.Models.ViewModels
{
    public class BasicConfigurationInfo
    {
        /// <summary>
        /// The guacamole sharp web socket url
        /// </summary>
        public string GuacamoleSharpWebSocket { get; set; }

        /// <summary>
        /// The guacamole sharp token url
        /// </summary>
        public string GuacamoleSharpTokenURL { get; set; }

        /// <summary>
        /// The guacamole sharp token phrase
        /// </summary>
        public string GuacamoleSharpTokenPhrase { get; set; }
    }
}
