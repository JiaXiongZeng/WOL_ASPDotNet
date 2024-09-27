using System.Net;
using WOL_ASPDotNet.Utilities.Implement;

namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface IICMPUtility: INetworkTool
    {
        /// <summary>
        /// 設定最大嘗試次數
        /// </summary>
        /// <param name="maximumTryail">最大嘗試次數 (預設值: 1)</param>
        void SetMaximumTryail(int maximumTryail = 1);

        /// <summary>
        /// 設定詢問的Timeout時間
        /// </summary>
        /// <param name="millisecs">毫秒 (預設值: 10000 i.e. 10秒鐘)</param>
        void SetTimeout(int millisecs = 10000);

        /// <summary>
        /// 嘗試測試目標主機是否有回應 (內網)
        /// </summary>
        /// <param name="IPv4">IPv4 Address</param>
        /// <param name="macAddress">Mac Address</param>
        /// <returns></returns>
        Task<ICMPEchoInfo> PingInternal(string IPv4, string macAddress);
    }
}
