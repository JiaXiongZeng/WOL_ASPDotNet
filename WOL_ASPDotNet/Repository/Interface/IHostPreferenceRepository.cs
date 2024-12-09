using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;

namespace WOL_ASPDotNet.Repository.Interface
{
    public interface IHostPreferenceRepository
    {
        /// <summary>
        /// 給定Mac Address取得連入主機的偏好設定
        /// </summary>
        /// <param name="macAddress">Mac Address</param>
        /// <returns></returns>
        public Task<HostPreferenceDataModel> GetAsync(string macAddress);

        /// <summary>
        /// 新增連入主機的偏好設定
        /// </summary>
        /// <param name="cond">新增連入主機偏好設定的Condition</param>
        /// <returns></returns>
        public Task<int> AddAsync(AddHostPreferenceCondition cond);

        /// <summary>
        /// 更新連入主機的偏好設定
        /// </summary>
        /// <param name="cond">更新連入主機偏好設定的Condition</param>
        /// <returns></returns>
        public Task<int> UpdateAsync(UpdateHostPreferenceCondition cond);

        /// <summary>
        /// 給定Mac Address刪除連入主機偏好設定的資訊
        /// </summary>
        /// <param name="macAddress">Mac Address</param>
        /// <returns></returns>
        public Task<int> DeleteAsync(string macAddress);
    }
}
