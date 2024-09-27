using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WOL_ASPDotNet.Infrastructure.DependencyInjections;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;

namespace WOL_ASPDotNet.Controllers
{
    public class ConfigController: ControllerBase
    {
        private IConfigurationRepository _configRep;

        public ConfigController(IConfigurationRepository configurationRepository) {
            this._configRep = configurationRepository;
        }

        [HttpGet]
        [Authorize(Roles ="Admin")]
        public async Task<IActionResult> Get()
        {
            var result = await this._configRep.GetConfigurationInfo();

            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Message = "Configuration loaded",
                Attachment = result
            };

            return Ok(respMsg);
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetBasic()
        {
            var fullConfigs = await this._configRep.GetConfigurationInfo();

            var result = new BasicConfigurationInfo
            {
                MstscHostURL = fullConfigs.MstscHostURL
            };

            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Message = "Configuration loaded",
                Attachment = result
            };

            return Ok(respMsg);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Save([FromBody] ConfigurationInfo data)
        {
            var updatedNum = await this._configRep.UpdateConfigurationInfo(data);

            //To notify timer the configuration has been altered
            NamedTimerService.notifyCacheExpirationTimespanChanged(data);
            NamedTimerService.notifyCacheDumpTimespanChanged(data);

            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Message = $"Configuration has been altered. {updatedNum} parameters was affected."
            };

            return Ok(respMsg);
        }
    }
}
