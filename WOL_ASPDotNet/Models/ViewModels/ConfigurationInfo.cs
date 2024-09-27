namespace WOL_ASPDotNet.Models.ViewModels
{
    public class ConfigurationInfo: IEquatable<ConfigurationInfo>
    {
        /// <summary>
        /// The network device for submiting the inquery packets
        /// </summary>
        public string NetworkDevice { get; set; }

        /// <summary>
        /// The expiration timespan of cahce (default: 30mins)
        /// </summary>
        public int? CacheExpirationTimespan { get; set; } = 30;

        /// <summary>
        /// The timespan for dumping cache from memory to database
        /// </summary>
        public int? CacheDumpTimespan { get; set; } = 1;

        /// <summary>
        /// The web mstsc server url
        /// </summary>
        public string MstscHostURL { get; set; }

        public bool Equals(ConfigurationInfo other)
        {
            if (this.NetworkDevice != other.NetworkDevice)
            {
                return false;
            }

            if (this.CacheExpirationTimespan != other.CacheExpirationTimespan)
            {
                return false;
            }

            if (this.CacheDumpTimespan != other.CacheDumpTimespan)
            {
                return false;
            }

            if (this.MstscHostURL != other.MstscHostURL)
            {
                return false;
            }

            return true;
        }
    }
}
