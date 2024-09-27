using WOL_ASPDotNet.Models.ViewModels;

namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface IArpSniffer : INetworkTool
    {
        /// <summary>
        /// 內網有回應的Host List
        /// </summary>
        public Dictionary<string, HostInfo> hostList { get; }

        /// <summary>
        /// 將HostList中過期的項目清空
        /// </summary>
        Task<int> DeleteExpiredEntries(TimeSpan? expireDuration = null);

        /// <summary>
        /// 對子網域發送廣播封包
        /// </summary>
        void SendArpBroadcast();
    }
}
