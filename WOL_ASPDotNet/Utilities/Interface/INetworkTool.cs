using System.Net;

namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface INetworkTool: IDisposable
    {
        /// <summary>
        /// 初始化Tool
        /// </summary>
        void Reset();

        /// <summary>
        /// 設定綁定的網卡
        /// </summary>
        /// <param name="keywords">網卡識別關鍵字</param>
        void SetDevice(string keywords = null);

        /// <summary>
        /// 是否已經設定網卡裝置
        /// </summary>
        /// <returns></returns>
        bool IsDeviceSet { get; }

        /// <summary>
        /// 開始捕捉封包
        /// </summary>
        void StartCapture();

        /// <summary>
        /// 是否已經啟用
        /// </summary>
        bool IsStarted { get; }

        /// <summary>
        /// 停止捕捉封包
        /// </summary>
        void StopCapture();
    }
}
