using System.Dynamic;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class PropertyIndexerWrapper
    {
        private object _obj;

        public PropertyIndexerWrapper(object obj) {
            this._obj = obj;
        }

        private object GetValue(string propertyName)
        {
            object value = null;

            if (this._obj == null)
            {
                throw new ArgumentException("The object is null");
            }

            var propInfo = this._obj.GetType().GetProperty(propertyName);
            value = propInfo?.GetValue(this._obj, null);

            return value;
        }

        private void SetValue(string propertyName, object val)
        {
            if (this._obj == null)
            {
                throw new ArgumentException("The object is null");
            }

            var propInfo = this._obj.GetType().GetProperty(propertyName);
            propInfo?.SetValue(this._obj, val);
        }


        public WrappedProperty this[string propertyName] {
            get
            {
                return new WrappedProperty(GetValue(propertyName));
            }

            set
            {
                SetValue(propertyName, value);
            }
        }
    }

    public class WrappedProperty
    {
        private object _obj;
        public WrappedProperty(object obj)
        {
            this._obj= obj;
        }

        public override string ToString()
        {
            if (this._obj == null)
            {
                return null;
            }

            return this._obj.ToString();
        }

        public bool Like(string keyword)
        {
            if (keyword == null && this._obj == null)
            {
                return true;
            }

            if (this._obj == null)
            {
                return false;
            }

            if (keyword == null)
            {
                return true;
            }

            var str = this._obj.ToString();

            return str.Contains(keyword);
        }
    }

    public static class ObjectPropertyExtension
    {
        public static IEnumerable<string> GetPropertyNames(this Type typeObj)
        {
            return typeObj.GetProperties().Select(x => x.Name);
        }
    }
}
