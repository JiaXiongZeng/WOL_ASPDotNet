using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using System.Data;
using WOL_ASPDotNet.Infrastructure.Options;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class DBConnectionHelper : IDBConnectionHelper
    {
        private string _strSQLite = null;

        public DBConnectionHelper(IOptions<ConnectionOption> connstrOptions) {
            this._strSQLite = connstrOptions.Value.SQLite;
        
        }

        public IDbConnection SQLite {
            get
            {
                return new SqliteConnection(this._strSQLite);
            }        
        }
    }    
}
