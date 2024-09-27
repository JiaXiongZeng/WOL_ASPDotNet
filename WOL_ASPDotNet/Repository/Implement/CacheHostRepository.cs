using Dapper;
using System.Net.Mail;
using System.Reflection;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Repository.Implement
{
    public class CacheHostRepository : ICacheHostRepository
    {
        public IDBConnectionHelper _dbConnHelp;
        public IConfigurationRepository _configRep;

        public CacheHostRepository(
            IDBConnectionHelper dbConnHelp,
            IConfigurationRepository configRep
            ) { 
            this._dbConnHelp = dbConnHelp;
            this._configRep = configRep;
        }

        public async Task<IEnumerable<CacheHostDataModel>> GetAll()
        {
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT * FROM CacheHost";

                var result = await conn.QueryAsync<CacheHostDataModel>(sql);

                return result;
            }
        }

        public async Task<IEnumerable<CacheHostDataModel>> GetExpiredOnes(TimeSpan? expireDuration = null)
        {
            //Retrieve cache expiration timespan from config table
            if (expireDuration == null)
            {
                expireDuration = await this._configRep.GetCacheExpirationTimepsan();
            }

            DateTime dueDate = DateTime.Now - expireDuration.Value;

            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT * FROM CacheHost
                               WHERE IFNULL(UpdateDatetime, CreateDatetime) <= @dueDate";

                var result = await conn.QueryAsync<CacheHostDataModel>(sql, new
                {
                    dueDate = dueDate
                });

                return result;
            }
        }

        public async Task<IEnumerable<CacheHostDataModel>> GetValidOnes(TimeSpan? expireDuration = null)
        {
            //Retrieve cache expiration timespan from config table
            if (expireDuration == null)
            {
                expireDuration = await this._configRep.GetCacheExpirationTimepsan();
            }

            DateTime dueDate = DateTime.Now - expireDuration.Value;

            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT * FROM CacheHost
                               WHERE IFNULL(UpdateDatetime, CreateDatetime) > @dueDate";

                var result = await conn.QueryAsync<CacheHostDataModel>(sql, new
                {
                    dueDate = dueDate
                });

                return result;
            }
        }

        public async Task<int> DeleteExpiredOnes(TimeSpan? expireDuration = null)
        {
            var expiredOnes = await this.GetExpiredOnes(expireDuration);

            var expiredMacAddrs = expiredOnes.Select(x => new { 
                MacAddress = x.MacAddress
            });

            int deletedNum = 0;
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"DELETE FROM CacheHost WHERE MacAddress = @MacAddress";
                deletedNum = await conn.ExecuteAsync(sql, expiredMacAddrs);
            }

            return deletedNum;
        }


        public async Task<int> Create(CacheHostDataModel model)
        {
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"INSERT INTO CacheHost(HostName, MacAddress, IPv4, CreateDatetime) 
                               VALUES(@HostName, @MacAddress, @IPv4, @CreateDatetime)";

                int addedNum = await conn.ExecuteAsync(sql, model);
                return addedNum;
            }
        }

        public async Task<int> Update(CacheHostDataModel model)
        {
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"UPDATE CacheHost SET 
                               HostName = @HostName,
                               IPv4 = @IPv4, 
                               UpdateDatetime = @UpdateDatetime, 
                               WHERE MacAddress = @MacAddress";

                int updatedNum = await conn.ExecuteAsync(sql, model);
                return updatedNum;
            }
        }

        public async Task<int> Delete(string macAddress = null)
        {
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"DELETE FROM CacheHost ";

                if (!string.IsNullOrEmpty(macAddress))
                {
                    sql += "WHERE MacAddress = @MacAddress ";
                }

                int deletedNum = await conn.ExecuteAsync(sql, new
                {
                    MacAddress = macAddress
                });
                return deletedNum;
            }
        }
    }
}
