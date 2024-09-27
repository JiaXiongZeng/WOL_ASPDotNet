using WOL_ASPDotNet.Models.Entities;

namespace WOL_ASPDotNet.Repository.Interface
{
    public interface IHostRepository
    {
        public Task<IEnumerable<HostDataModel>> GetHostList();

        public Task<int> AddToHostList(IEnumerable<HostDataModel> hosts);

        public Task<int> UpdateHostList(IEnumerable<HostDataModel> hosts);

        public Task<int> DeleteHostList(IEnumerable<HostDataModel> hosts);
    }
}
