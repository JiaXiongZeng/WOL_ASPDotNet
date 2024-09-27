using Microsoft.AspNetCore.Mvc.ActionConstraints;

namespace WOL_ASPDotNet.Infrastructure.Filters
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
    public class QueryParameterConstraintAttribute : Attribute, IActionConstraint
    {
        private readonly string _parameterName;
        private readonly string _parameterValue;

        public QueryParameterConstraintAttribute(string parameterName, string parameterValue)
        {
            this._parameterName = parameterName;
            this._parameterValue = parameterValue;
        }

        public bool Accept(ActionConstraintContext context)
        {
            bool result = false;

            if (context.RouteContext.HttpContext.Request.Query.Keys.Contains(this._parameterName))
            {
                if (context.RouteContext.HttpContext.Request.Query[this._parameterName] == this._parameterValue)
                {
                    result = true;
                }
            }

            return result;
        }

        public int Order { get; }
    }
}
