using System.Data;

namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface IDBConnectionHelper
    {
        public IDbConnection SQLite { get; }

        public IDbConnection KeyRing { get; }
    }
}
