using Dapper;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Repository.Implement
{
    public class HostRepository : IHostRepository
    {
        private IDBConnectionHelper _dbConnHelp;
        public HostRepository(IDBConnectionHelper dBConnectionHelper) { 
            _dbConnHelp = dBConnectionHelper;
        }


        public async Task<IEnumerable<HostDataModel>> GetHostList()
        {
            using (var conn = _dbConnHelp.SQLite)
            {
                string sql = @"SELECT * 
                               FROM Host 
                               ORDER BY SN";
                var result = await conn.QueryAsync<HostDataModel>(sql);
                return result;
            }
        }

        public async Task<int> AddToHostList(IEnumerable<HostDataModel> hosts)
        {
            using (var conn = _dbConnHelp.SQLite)
            {
                string sql = @"INSERT INTO Host(HostName, Domain, IPv4, IPv6, MacAddress, WOL_Port, SN, 
                                                CreateId, CreateDatetime, UpdateId, UpdateDatetime) 
                               VALUES (@HostName, @Domain, @IPv4, @IPv6, @MacAddress, @WOL_Port, @SN, 
                                                @CreateId, @CreateDatetime, @UpdateId, @UpdateDatetime)";

                var result = await conn.ExecuteAsync(sql, hosts);
                return result;
            }
        }

        public async Task<int> UpdateHostList(IEnumerable<HostDataModel> hosts)
        {
            using (var conn = _dbConnHelp.SQLite)
            {
                string sql = @"UPDATE Host 
                                  SET HostName = @HostName, 
                                      Domain = @Domain, 
                                      IPv4 = @IPv4,
                                      WOL_Port = @WOL_Port
                               WHERE MacAddress = @MacAddress";
                var result = await conn.ExecuteAsync(sql, hosts);
                return result;
            }
        }

        public async Task<int> DeleteHostList(IEnumerable<HostDataModel> hosts)
        {
            using (var conn = _dbConnHelp.SQLite)
            {
                string sql = @"DELETE FROM Host 
                               WHERE MacAddress = @MacAddress";
                var result = await conn.ExecuteAsync(sql, hosts);
                return result;
            }
        }
    }
}
