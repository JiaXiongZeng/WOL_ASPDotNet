using System.Text.Json;

namespace WOL_ASPDotNet.Infrastructure.Base
{
    public class CustomizedSessionWrapper
    {
        public ISession _session;

        public CustomizedSessionWrapper(ISession session)
        {
            this._session = session;
        }

        private void Set(string key, object value)
        {
            this._session.SetString(key, JsonSerializer.Serialize(value));
        }

        public T Get<T>(string key)
        {
            var value = this._session.GetString(key);
            return (value == null ? default : JsonSerializer.Deserialize<T>(value));
        }

        public object this[string key]
        {
            set
            {
                this.Set(key, value);
            }
        }

        public void ClearAll()
        {
            this._session.Clear();
        }
    }
}
