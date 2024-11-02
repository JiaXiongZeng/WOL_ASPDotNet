using Dapper;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Repository.Implement
{
    public class KeyRingRepository : IKeyRingRepository
    {
        private IDBConnectionHelper _dbConnHelp;
        private ICryptoUtility _cryptoUtility;

        public KeyRingRepository(
            IDBConnectionHelper dbConnHelp,
            ICryptoUtility cryptoUtility)
        {
            this._dbConnHelp = dbConnHelp;
            this._cryptoUtility = cryptoUtility;
        }

        public async Task<HostCredentialKeyPairDataModel> GetHostCredentialKeyPairAsync(string macAddress)
        {
            using(var conn = this._dbConnHelp.KeyRing)
            {
                string sql = @"SELECT MacAddress, PrivateKey, PublicKey,
                                      CreateId, CreateDatetime, UpdateId, UpdateDatetime
                               FROM HostCredentialKeyPair
                               WHERE MacAddress = @MacAddress";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("MacAddress", macAddress);

                var result = await conn.QueryFirstOrDefaultAsync<HostCredentialKeyPairDataModel>(sql, parameters);
                return result;
            }
        }

        public async Task<(string PrivateKey, string PublicKey)?> GenHostCredentialKeyPairAsync(GenHostCredentialKeyPairCondition cond)
        {
            var oldData = await this.GetHostCredentialKeyPairAsync(cond.MacAddress);
            using (var conn = this._dbConnHelp.KeyRing)
            {
                string sql = "";
                DynamicParameters parameters = new DynamicParameters();
                var keyPairs = this._cryptoUtility.GenAsymmetricKeys();
                if (oldData == null)
                {
                    sql = @"INSERT INTO HostCredentialKeyPair
                               (MacAddress, PrivateKey, PublicKey, CreateId, CreateDatetime)
                            VALUES
                               (@MacAddress, @PrivateKey, @PublicKey, @CreateId, @CreateDatetime)";
                    
                    parameters.Add("CreateId", cond.LoginId);
                    parameters.Add("CreateDatetime", DateTime.Now);
                    
                }
                else
                {
                    sql = @"UPDATE HostCredentialKeyPair
                               SET MacAddress = @MacAddress,
                                   PrivateKey = @PrivateKey,
	                               PublicKey = @PublicKey,
	                               UpdateId = @UpdateId,
	                               UpdateDatetime = @UpdateDatetime
                             WHERE MacAddress = @MacAddress";

                    parameters.Add("UpdateId", cond.LoginId);
                    parameters.Add("UpdateDatetime", DateTime.Now);
                }

                parameters.Add("MacAddress", cond.MacAddress);
                parameters.Add("PrivateKey", keyPairs.PrivateKey);
                parameters.Add("PublicKey", keyPairs.PublicKey);

                var result = await conn.ExecuteAsync(sql, parameters);
                if (result > 0)
                {
                    return keyPairs;
                }

                return null;
            }
        }

        public async Task<int> RevokeHostCredentialKeyPairAsync(string macAddress)
        {
            using (var conn = this._dbConnHelp.KeyRing)
            {
                string sql = @"DELETE FROM HostCredentialKeyPair
                               WHERE MacAddress = @MacAddress";

                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("MacAddress", macAddress);

                int affectedRows = await conn.ExecuteAsync(sql, parameters);
                return affectedRows;
            }
        }
    }
}
