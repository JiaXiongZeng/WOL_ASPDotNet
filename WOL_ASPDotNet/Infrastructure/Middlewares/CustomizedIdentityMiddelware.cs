
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Security.Claims;
using WOL_ASPDotNet.Infrastructure.Base;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Models.Entities;

namespace WOL_ASPDotNet.Infrastructure.Middlewares
{
    public class CustomizedIdentityMiddelware : IMiddleware
    {
        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var Session = new CustomizedSessionWrapper(context.Session);
            var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
            if (userData != null)
            {
                var claimList = new List<Claim>() {
                    new Claim(ClaimTypes.Sid, userData.UID.ToString()),
                    new Claim(ClaimTypes.Role, "User")
                };

                if (!string.IsNullOrEmpty(userData.LocalID))
                {
                    claimList.Add(new Claim(ClaimTypes.NameIdentifier, userData.LocalID));
                }

                if (!string.IsNullOrEmpty(userData.Email))
                {
                    claimList.Add(new Claim(ClaimTypes.Email, userData.Email));
                }

                if (!string.IsNullOrEmpty(userData.UserName))
                {
                    claimList.Add(new Claim(ClaimTypes.Name, userData.UserName));
                }

                if (!string.IsNullOrEmpty(userData.Phone))
                {
                    claimList.Add(new Claim(ClaimTypes.MobilePhone, userData.Phone));
                }

                if (userData.IsAdmin)
                {
                    claimList.Add(new Claim(ClaimTypes.Role, "Admin"));
                }

                var identity = new ClaimsIdentity(claimList, "custom");
                context.User = new ClaimsPrincipal(identity);
            }

            await next.Invoke(context);
        }
    }
}
