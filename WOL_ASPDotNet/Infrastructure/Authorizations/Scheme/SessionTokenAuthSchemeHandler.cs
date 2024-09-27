using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;
using WOL_ASPDotNet.Infrastructure.Base;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Models.Entities;

namespace WOL_ASPDotNet.Infrastructure.Authorizations.Scheme
{
    public class SessionTokenAuthSchemeHandler : AuthenticationHandler<SessionTokenAuthSchemeOptions>
    {
        public SessionTokenAuthSchemeHandler(
            IOptionsMonitor<SessionTokenAuthSchemeOptions> options, 
            ILoggerFactory logger, 
            UrlEncoder encoder) : base(options, logger, encoder)
        {
        }

        protected async override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            await Task.Yield();

            var Session = new CustomizedSessionWrapper(this.Context.Session);
            var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
            if (userData != null)
            {
                var claims = new List<Claim>() {
                    new Claim(ClaimTypes.Sid, userData.UID.ToString()),
                    new Claim(ClaimTypes.Role, "User")
                };

                if (!string.IsNullOrEmpty(userData.LocalID))
                {
                    claims.Add(new Claim(ClaimTypes.NameIdentifier, userData.LocalID));
                }

                if (!string.IsNullOrEmpty(userData.Email))
                {
                    claims.Add(new Claim(ClaimTypes.Email, userData.Email));
                }

                if (!string.IsNullOrEmpty(userData.UserName))
                {
                    claims.Add(new Claim(ClaimTypes.Name, userData.UserName));
                }

                if (!string.IsNullOrEmpty(userData.Phone))
                {
                    claims.Add(new Claim(ClaimTypes.MobilePhone, userData.Phone));
                }

                if (userData.IsAdmin)
                {
                    claims.Add(new Claim(ClaimTypes.Role, "Admin"));
                }

                var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Tokens"));
                var ticket = new AuthenticationTicket(principal, this.Scheme.Name);
                return AuthenticateResult.Success(ticket);                
            }

            return AuthenticateResult.Fail("Authentication failed");
        }
    }
}
