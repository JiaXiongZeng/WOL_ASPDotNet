using Dapper;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Repository.Implement
{
    public class HostCredentialRepository : IHostCredentialRepository
    {
        private IDBConnectionHelper _dbConnHelp;

        public HostCredentialRepository(IDBConnectionHelper dBConnectionHelper)
        {
            this._dbConnHelp = dBConnectionHelper;
        }

        public async Task<HostCredentialDataModel> GetAsync(string macAddress)
        {
            using(var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT MacAddress,
                                      RDP_Port, RDP_Domain, RDP_UserName, RDP_Password,
                                      SSH_Port, SSH_UserName, SSH_Password,
	                                  VNC_Port, VNC_UserName, VNC_Password,
                                      CreateId, CreateDatetime, UpdateId, UpdateDatetime 
                               FROM HostCredential
                               WHERE MacAddress = @MacAddress";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("MacAddress", macAddress);

                var result = await conn.QueryFirstOrDefaultAsync<HostCredentialDataModel>(sql, parameters);
                return result;
            }
        }

        public async Task<int> AddAsync(AddHostCredentialCondition cond)
        {
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"INSERT INTO HostCredential
                                 (MacAddress, RDP_Port, RDP_Domain, RDP_UserName, RDP_Password,
                                  SSH_Port, SSH_UserName, SSH_Password,
                                  VNC_Port, VNC_UserName, VNC_Password,
                                  CreateId, CreateDatetime)
                               VALUES
                                 (@MacAddress, @RDP_Port, @RDP_Domain, @RDP_UserName, @RDP_Password,
                                  @SSH_Port, @SSH_UserName, @SSH_Password,
                                  @VNC_Port, @VNC_UserName, @VNC_Password,
                                  @CreateId, @CreateDatetime)";

                int affectedRows = await conn.ExecuteAsync(sql, cond);
                return affectedRows;
            }
        }

        public async Task<int> UpdateAsync(UpdateHostCredentialCondition cond)
        {
            using(var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"UPDATE HostCredential
                                  SET RDP_Port = @RDP_Port,
                                      RDP_Domain = @RDP_Domain,
	                                  RDP_UserName = @RDP_UserName,
	                                  RDP_Password = @RDP_Password,
	                                  SSH_Port = @SSH_Port,
	                                  SSH_UserName = @SSH_UserName,
	                                  SSH_Password = @SSH_Password,
	                                  VNC_Port = @VNC_Port,
	                                  VNC_UserName = @VNC_UserName,
	                                  VNC_Password = @VNC_Password,
	                                  UpdateId = @UpdateId,
	                                  UpdateDatetime = @UpdateDatetime
                               WHERE MacAddress = @MacAddress";

                int affectedRows = await conn.ExecuteAsync(sql, cond);
                return affectedRows;
            }
        }

        public async Task<int> DeleteAsync(string macAddress)
        {
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"DELETE FROM HostCredential
                               WHERE MacAddress = @MacAddress";

                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("MacAddress", macAddress);

                int affectedRows = await conn.ExecuteAsync(sql, parameters);
                return affectedRows;
            }
        }
    }
}
