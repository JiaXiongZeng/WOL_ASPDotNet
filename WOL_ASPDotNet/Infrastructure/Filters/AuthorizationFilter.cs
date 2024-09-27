using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Net;
using WOL_ASPDotNet.Infrastructure.Base;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Models.Entities;

namespace WOL_ASPDotNet.Infrastructure.Filters
{
    public class AuthorizationFilter : IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            //var Session = new CustomizedSessionWrapper(context.HttpContext.Session);

            bool isAllowAnoymousAttrLevel = context.ActionDescriptor.EndpointMetadata
                                            .Any(x => x.GetType() == typeof(AllowAnonymousAttribute));
            bool isAllowAnoymousControllerLevel = context.Filters
                                                  .Any(x => x.GetType() == typeof(AllowAnonymousAttribute));

            bool isAllowAnoymous = isAllowAnoymousAttrLevel || isAllowAnoymousControllerLevel;

            //var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
            //if (!isAllowAnoymous && userData == null)

            bool isAuthenticated = context.HttpContext.User.Identity.IsAuthenticated;
            if (!isAllowAnoymous && !isAuthenticated)
            {
                context.Result = new EmptyResult();
                context.HttpContext.Response.StatusCode = (int) HttpStatusCode.Unauthorized;
            }
        }
    }
}
