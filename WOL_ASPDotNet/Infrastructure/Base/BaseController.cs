using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace WOL_ASPDotNet.Infrastructure.Base
{
    public class BaseController: Controller
    {
        internal CustomizedSessionWrapper Session { get; private set; }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            base.OnActionExecuting(context);
            initCustomizedSession();
        }

        private void initCustomizedSession()
        {
            this.Session = new CustomizedSessionWrapper(HttpContext.Session);
        }
    }
}
