using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using System.Data;
using System.Diagnostics;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Infrastructure.Options;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class DBConnectionHelper : IDBConnectionHelper
    {
        private const string DEFAULT_KEY_RING_PWD = "aA1234567";

        private string _strSQLite = null;

        private string _strKeyRing = null;

        private ILogger<DBConnectionHelper> _logger;

        public DBConnectionHelper(
            ILoggerFactory loggerFactory,
            IOptions<ConnectionOption> connstrOptions)
        {
            this._logger = loggerFactory.CreateLogger<DBConnectionHelper>();

            /***************************** Initialize Main SQLite Connection String  *****************************/
            this._strSQLite = new SqliteConnectionStringBuilder(connstrOptions.Value.SQLite)
            {
                Mode = SqliteOpenMode.ReadWrite
            }.ToString();


            /************************** Initialize Encrypted KeyRings Connection String **************************/

            //Default password connection
            this._strKeyRing = new SqliteConnectionStringBuilder(connstrOptions.Value.KeyRing)
            {
                Mode = SqliteOpenMode.ReadWrite,
                Password = DEFAULT_KEY_RING_PWD
            }.ToString();

            //If user set the key_ring_password, change the password if not set yet.
            var envKeyRingPwd = Environment.GetEnvironmentVariable(EnvironmentVariables.KEY_RING_PASSWORD);
            if (!string.IsNullOrEmpty(envKeyRingPwd) && envKeyRingPwd != DEFAULT_KEY_RING_PWD) 
            {
                var newConnStr = new SqliteConnectionStringBuilder(connstrOptions.Value.KeyRing)
                {
                    Mode = SqliteOpenMode.ReadWrite,
                    Password = envKeyRingPwd
                }.ToString();
                if (isConnectable(newConnStr))
                {
                    this._strKeyRing = newConnStr;
                    return;
                }
                
                if (isConnectable(this._strKeyRing))
                {
                    if (tryChangePassword(this._strKeyRing, DEFAULT_KEY_RING_PWD, envKeyRingPwd))
                    {
                        this._strKeyRing = new SqliteConnectionStringBuilder(connstrOptions.Value.KeyRing)
                        {
                            Mode = SqliteOpenMode.ReadWrite,
                            Password = envKeyRingPwd
                        }.ToString();
                        return;
                    }
                }
            }

            if (!isConnectable(this._strKeyRing))
            {
                this._logger.LogError($"The password of KeyRings.db has been changed! Please check the envrionment variable {EnvironmentVariables.KEY_RING_PASSWORD}");
                Environment.Exit(1);
            }

            //Warning users to set the environment variable KEY_RING_PASSWORD
            this._logger.LogWarning($"Please set the environment variable {EnvironmentVariables.KEY_RING_PASSWORD} with a strong password; {Environment.NewLine}" +
                                     "otherwise, your credentials would be stolen by malicious hackers.");
        }

        public IDbConnection SQLite {
            get
            {
                return new SqliteConnection(this._strSQLite);
            }
        }

        public IDbConnection KeyRing
        {
            get
            {
                return new SqliteConnection(this._strKeyRing);
            }
        }

        private bool isConnectable(string connStr)
        {
            bool isEnable = false;
            try
            {
                using (var conn = new SqliteConnection(connStr))
                {
                    conn.Open();
                    isEnable = true;
                    conn.Close();
                }
            }
            catch (Exception e)
            {
                //Do nothing
            }

            return isEnable;
        }

        private bool tryChangePassword(string ConnStr, string oldPwd, string newPwd)
        {
            var result = false;
            try
            {
                string defaultConn = new SqliteConnectionStringBuilder(ConnStr)
                {
                    Mode = SqliteOpenMode.ReadWrite,
                    Password = oldPwd
                }.ToString();


                using (var conn = new SqliteConnection(defaultConn))
                {
                    conn.Open();
                    var command = conn.CreateCommand();
                    command.CommandText = "SELECT quote($newPassword);";
                    command.Parameters.AddWithValue("$newPassword", newPwd);
                    var quotedNewPassword = (string)command.ExecuteScalar();

                    command.CommandText = "PRAGMA rekey = " + quotedNewPassword;
                    command.Parameters.Clear();
                    command.ExecuteNonQuery();
                    conn.Close();
                }

                result = true;
            }
            catch (Exception e)
            {
                this._logger.LogError($"Can't access '{ConnStr}'. Please check the file exists or password is correct.{Environment.NewLine}" +
                                        e.Message);
            }

            return result;
        }
    }    
}
