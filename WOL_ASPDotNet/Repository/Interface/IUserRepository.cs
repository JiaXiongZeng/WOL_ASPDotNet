using WOL_ASPDotNet.Models.Entities;

namespace WOL_ASPDotNet.Repository.Interface
{
    public interface IUserRepository
    {
        public Task<UserDataModel> GetLocalAsync(string id, string pwd = null);

        public Task<IEnumerable<UserDataModel>> GetUserInfoListAsync(IEnumerable<string> localIds = null);

        public Task<int> InsertUserInfosAsync(IEnumerable<UserDataModel> userInfos);

        public Task<int> UpdateUserInfosAsync(IEnumerable<UserDataModel> userInfos);
    }
}
