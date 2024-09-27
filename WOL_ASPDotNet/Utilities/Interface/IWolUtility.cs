using System.Net.NetworkInformation;
using WOL_ASPDotNet.Models.ViewModels;

namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface IWolUtility: INetworkTool
    {
        /// <summary>
        /// 喚醒指定實體位置的PC
        /// </summary>
        /// <param name="info">The info model</param>
        /// <returns></returns>
        Task WakeUpAsync(WakeOnLanInfo info);
    }
}
