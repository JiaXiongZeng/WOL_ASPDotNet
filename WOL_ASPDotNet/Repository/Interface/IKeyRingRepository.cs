using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;

namespace WOL_ASPDotNet.Repository.Interface
{
    public interface IKeyRingRepository
    {
        Task<HostCredentialKeyPairDataModel> GetHostCredentialKeyPairAsync(string macAddress);

        Task<(string PrivateKey, string PublicKey)?> GenHostCredentialKeyPairAsync(GenHostCredentialKeyPairCondition cond);

        Task<int> RevokeHostCredentialKeyPairAsync(string macAddress);
    }
}
