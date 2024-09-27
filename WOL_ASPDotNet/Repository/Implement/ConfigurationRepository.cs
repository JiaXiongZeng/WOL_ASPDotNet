using Dapper;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Implement;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Repository.Implement
{
    public class ConfigurationRepository : IConfigurationRepository
    {
        private IDBConnectionHelper _dbConnHelp;
        private INetworkDevices _networkDevices;

        public ConfigurationRepository(
            IDBConnectionHelper dBConnectionHelper,
            INetworkDevices networkDevices
            ) { 
            this._dbConnHelp = dBConnectionHelper;
            this._networkDevices = networkDevices;
        }        

        public async Task<IEnumerable<ConfigurationDataModel>> GetConfigurations()
        {
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT * FROM Configuration
                               WHERE Enable = True";
                var records = await conn.QueryAsync<ConfigurationDataModel>(sql);

                return records;
            }
        }

        public async Task<int> UpdateConfigurations(IEnumerable<ConfigurationDataModel> dataModels)
        {
            int affectedNum = 0;
            int insertedNum = 0;

            using (var conn = this._dbConnHelp.SQLite)
            {
                conn.Open();
                using (var trans = conn.BeginTransaction())
                {
                    string sql = @"DELETE FROM Configuration";
                    affectedNum = await conn.ExecuteAsync(sql, null, trans);

                    sql = @"INSERT INTO Configuration(FieldID, FieldValue, Enable) VALUES(@FieldID, @FieldValue, @Enable)";
                    insertedNum = await conn.ExecuteAsync(sql, dataModels, trans);

                    trans.Commit();
                }
                conn.Close();
            }

            var updateNum = new List<int>() { affectedNum, insertedNum };
            return updateNum.Max();
        }

        public async Task<string> GetNetworkDeviceID()
        {
            string result = null;
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT FieldValue FROM Configuration
                               WHERE FieldID = 'NetworkDevice'
                               AND Enable = True";
                result = await conn.QuerySingleOrDefaultAsync<string>(sql);
            }


            var devices = this._networkDevices.getDeviceInfoList();

            var device = devices.FirstOrDefault(x => x.ID == result);
            if (device == null)
            {
                result = devices.FirstOrDefault().ID;
            }

            return result;
        }

        public async Task<TimeSpan> GetCacheExpirationTimepsan()
        {
            //Default expiration timespan is 30 minutes
            TimeSpan result = TimeSpan.FromMinutes(30);
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT FieldValue FROM Configuration
                               WHERE FieldID = 'CacheExpirationTimespan'
                               AND Enable = True";

                var configCacheTS = await conn.QuerySingleOrDefaultAsync<string>(sql);


                if (int.TryParse(configCacheTS, out int minutes))
                {
                    result = TimeSpan.FromMinutes(minutes);
                }

                return result;
            }
        }

        public async Task<TimeSpan> GetCacheDumpTimespan()
        {
            //Default dump timespan is 1 minute
            TimeSpan result = TimeSpan.FromMinutes(1);
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT FieldValue FROM Configuration
                               WHERE FieldID = 'CacheDumpTimespan'
                               AND Enable = True";

                var configCacheTS = await conn.QuerySingleOrDefaultAsync<string>(sql);


                if (int.TryParse(configCacheTS, out int minutes))
                {
                    result = TimeSpan.FromMinutes(minutes);
                }

                return result;
            }
        }

        public async Task<ConfigurationInfo> GetConfigurationInfo()
        {
            ConfigurationInfo result = null;

            var records = await this.GetConfigurations();
            if (records.Count() > 0)
            {
                var kvPairs = records.Select(x => new KeyValuePair<string, string>(x.FieldID, x.FieldValue));
                result = kvPairs.DeserializeFromKeyValueParis<ConfigurationInfo>();
            }

            return result;
        }

        public async Task<int> UpdateConfigurationInfo(ConfigurationInfo configurationInfo)
        {
            int updatedNum = 0;
            var keyValueParis = configurationInfo.SerializeToKeyValuePairs();

            var dataModels = keyValueParis.Select(x => new ConfigurationDataModel
            {
                FieldID = x.Key,
                FieldValue = x.Value,
                Enable = true
            });

            updatedNum = await this.UpdateConfigurations(dataModels);

            return updatedNum;
        }
    }
}
