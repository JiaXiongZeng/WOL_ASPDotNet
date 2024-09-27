using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;

namespace WOL_ASPDotNet.Repository.Interface
{
    public interface IConfigurationRepository
    {
        public Task<IEnumerable<ConfigurationDataModel>> GetConfigurations();

        public Task<int> UpdateConfigurations(IEnumerable<ConfigurationDataModel> dataModels);

        public Task<string> GetNetworkDeviceID();

        public Task<TimeSpan> GetCacheExpirationTimepsan();

        public Task<TimeSpan> GetCacheDumpTimespan();

        public Task<ConfigurationInfo> GetConfigurationInfo();

        public Task<int> UpdateConfigurationInfo(ConfigurationInfo configurationInfo);
    }
}
