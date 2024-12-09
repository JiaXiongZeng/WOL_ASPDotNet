using Dapper;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Repository.Implement
{
    public class HostPreferenceRepository : IHostPreferenceRepository
    {
        private IDBConnectionHelper _dbConnHelp;

        public HostPreferenceRepository(IDBConnectionHelper dbConnectionHelper)
        {
            this._dbConnHelp = dbConnectionHelper;
        }

        public async Task<HostPreferenceDataModel> GetAsync(string macAddress)
        {
            using (var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"SELECT MacAddress,
                                      RDP_Wallpaper, RDP_Theming, RDP_FontSmoothing,
	                                  RDP_FullWindowDrag, RDP_DesktopComposition, RDP_MenuAnimations,
	                                  CreateId, CreateDatetime, UpdateId, UpdateDatetime 
                               FROM HostPreference
                               WHERE MacAddress = @MacAddress";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("MacAddress", macAddress);

                var result = await conn.QueryFirstOrDefaultAsync<HostPreferenceDataModel>(sql, parameters);
                return result;
            }
        }

        public async Task<int> AddAsync(AddHostPreferenceCondition cond)
        {
            using(var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"INSERT INTO HostPreference
                                 (MacAddress, RDP_Wallpaper, RDP_Theming, RDP_FontSmoothing,
	                                          RDP_FullWindowDrag, RDP_DesktopComposition, RDP_MenuAnimations,
					                          CreateId, CreateDatetime)
		                       VALUES
		                         (@MacAddress, @RDP_Wallpaper, @RDP_Theming, @RDP_FontSmoothing, 
                                  @RDP_FullWindowDrag, @RDP_DesktopComposition, @RDP_MenuAnimations, 
                                  @CreateId, @CreateDatetime)";

                int affectedRows = await conn.ExecuteAsync(sql, cond);
                return affectedRows;
            }
        }

        public async Task<int> UpdateAsync(UpdateHostPreferenceCondition cond)
        {
            using(var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"UPDATE HostPreference
                                  SET RDP_Wallpaper = @RDP_Wallpaper,
                                      RDP_Theming = @RDP_Theming,
	                                  RDP_FontSmoothing = @RDP_FontSmoothing,
	                                  RDP_FullWindowDrag = @RDP_FullWindowDrag,
	                                  RDP_DesktopComposition = @RDP_DesktopComposition,
	                                  RDP_MenuAnimations = @RDP_MenuAnimations,
	                                  UpdateId = @UpdateId,
	                                  UpdateDatetime = @UpdateDatetime
                                WHERE MacAddress = @MacAddress";

                int affectedRows = await conn.ExecuteAsync(sql, cond);
                return affectedRows;
            }
        }        

        public async Task<int> DeleteAsync(string macAddress)
        {
            using(var conn = this._dbConnHelp.SQLite)
            {
                string sql = @"DELETE FROM HostPreference
                               WHERE MacAddress = @MacAddress";

                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("MacAddress", macAddress);

                int affectedRows = await conn.ExecuteAsync(sql, parameters);
                return affectedRows;
            }
        }
    }
}
