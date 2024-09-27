using WOL_ASPDotNet.Models.Entities;

namespace WOL_ASPDotNet.Repository.Interface
{
    public interface ICacheHostRepository
    {
        public Task<IEnumerable<CacheHostDataModel>> GetAll();

        public Task<IEnumerable<CacheHostDataModel>> GetExpiredOnes(TimeSpan? expireDuration = null);

        public Task<IEnumerable<CacheHostDataModel>> GetValidOnes(TimeSpan? expireDuration = null);

        public Task<int> DeleteExpiredOnes(TimeSpan? expireDuration = null);

        public Task<int> Create(CacheHostDataModel model);

        public Task<int> Update(CacheHostDataModel model);

        public Task<int> Delete(string macAddress = null);
    }
}
