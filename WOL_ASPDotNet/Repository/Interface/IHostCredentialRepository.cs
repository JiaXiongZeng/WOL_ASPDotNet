using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;

namespace WOL_ASPDotNet.Repository.Interface
{
    public interface IHostCredentialRepository
    {
        /// <summary>
        /// 給定Mac Address取得登入該主機的資訊
        /// </summary>
        /// <param name="macAddress">Mac Address</param>
        /// <returns></returns>
        public Task<HostCredentialDataModel> GetAsync(string macAddress);

        /// <summary>
        /// 新增登入主機的資訊
        /// </summary>
        /// <param name="cond">新增登入主機的Condition</param>
        /// <returns></returns>
        public Task<int> AddAsync(AddHostCredentialCondition cond);

        /// <summary>
        /// 更新登入主機的資訊
        /// </summary>
        /// <param name="cond">更新登入主機的Condition</param>
        /// <returns></returns>
        public Task<int> UpdateAsync(UpdateHostCredentialCondition cond);

        /// <summary>
        /// 給定Mac Address刪除登入該主機的資訊
        /// </summary>
        /// <param name="macAddress">Mac Address</param>
        /// <returns></returns>
        public Task<int> DeleteAsync(string macAddress);
    }
}
