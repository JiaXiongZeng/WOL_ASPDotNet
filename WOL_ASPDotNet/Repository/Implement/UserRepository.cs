using Dapper;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Repository.Implement
{
    public class UserRepository : IUserRepository
    {
        private IDBConnectionHelper _dbConnHelp;
        public UserRepository(IDBConnectionHelper dbConnHelp)
        {
            _dbConnHelp = dbConnHelp;
        }        

        public async Task<UserDataModel> GetLocalAsync(string id, string pwd = null)
        {
            using (var conn = _dbConnHelp.SQLite)
            {
                string sql = @"SELECT * FROM User
                               WHERE LocalID = @LocalID 
                                 AND Status = 'A' ";   //Status is active

                var parameters = new DynamicParameters();
                parameters.Add("LocalID", id);


                if (!string.IsNullOrEmpty(pwd))
                {
                    sql = $@"{sql}
                             AND LocalPWD = @LocalPWD
                            ";
                    parameters.Add("LocalPWD", pwd);
                }


                var result = await conn.QueryFirstOrDefaultAsync<UserDataModel>(sql, parameters);
                return result;
            }
        }

        public async Task<IEnumerable<UserDataModel>> GetUserInfoListAsync(IEnumerable<string> localIds = null)
        {
            using (var conn = _dbConnHelp.SQLite)
            {
                string sql = @"SELECT * FROM User";

                var parameters = new DynamicParameters();

                if (localIds != null && localIds.Any())
                {
                    sql = $@"{sql} WHERE LocalID in @LocalIDs";
                    parameters.Add("LocalIDs", localIds);
                }

                var result = await conn.QueryAsync<UserDataModel>(sql, parameters);
                return result;
            }
        }

        public async Task<int> UpdateUserInfosAsync(IEnumerable<UserDataModel> userInfos)
        {
            using (var conn = _dbConnHelp.SQLite)
            {
                string sql = @"UPDATE User 
                               SET LocalPWD = @LocalPWD, 
                                   UserName = @UserName, 
                                   Email = @Email, 
                                   Phone = @Phone, 
                                   IsAdmin = @IsAdmin, 
                                   Status = @Status, 
                                   Modifytime = @Modifytime 
                               WHERE LocalID = @LocalID";
                int affectedRows = await conn.ExecuteAsync(sql, userInfos);
                return affectedRows;
            }
        }

        public async Task<int> InsertUserInfosAsync(IEnumerable<UserDataModel> userInfos)
        {
            using (var conn = _dbConnHelp.SQLite)
            {
                string sql = @"INSERT INTO User (LocalID, LocalPWD, UserName, Email, Phone,
                                                 IsAdmin, Status, Createtime_LocalID)
                                           VALUES (@LocalID, @LocalPWD, @UserName, @Email, @Phone,
                                                   @IsAdmin, @Status, @Createtime_LocalID)";
                int affectedRows = await conn.ExecuteAsync(sql, userInfos);
                return affectedRows;
            }
        }
    }
}
