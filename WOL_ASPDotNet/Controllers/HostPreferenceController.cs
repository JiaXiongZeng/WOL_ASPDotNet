using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WOL_ASPDotNet.Infrastructure.Base;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;

namespace WOL_ASPDotNet.Controllers
{
    [Authorize]
    public class HostPreferenceController: BaseController
    {
        private IHostPreferenceRepository _hostPreferenceRepository;

        public HostPreferenceController (IHostPreferenceRepository hostPreferenceRepository)
        {
            _hostPreferenceRepository = hostPreferenceRepository;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string macAddress)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                var data = await this._hostPreferenceRepository.GetAsync(macAddress);
                if (data == null)
                {
                    result.Status = MESSAGE_STATUS.OK;
                    return Ok(result);
                }

                var viewModel = new HostPreferenceViewModel
                {
                    MacAddress = macAddress,
                    RDP_Wallpaper = data.RDP_Wallpaper,
                    RDP_Theming = data.RDP_Theming,
                    RDP_FontSmoothing = data.RDP_FontSmoothing,
                    RDP_FullWindowDrag = data.RDP_FullWindowDrag,
                    RDP_DesktopComposition = data.RDP_DesktopComposition,
                    RDP_MenuAnimations = data.RDP_MenuAnimations,
                    CreateId = data.CreateId,
                    CreateDatetime = data.CreateDatetime,
                    UpdateId = data.UpdateId,
                    UpdateDatetime = data.UpdateDatetime
                };

                result.Status = MESSAGE_STATUS.OK;
                result.Attachment = viewModel;
            }
            catch (Exception e)
            {
                result.Status = MESSAGE_STATUS.ERROR;
                result.Message = e.Message;
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetRDP([FromQuery] string macAddress)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                var data = await this._hostPreferenceRepository.GetAsync(macAddress);
                if (data == null)
                {
                    result.Status = MESSAGE_STATUS.OK;
                    return Ok(result);
                }

                var viewModel = new PreferenceRdpViewModel
                {
                    RDP_Wallpaper = data.RDP_Wallpaper,
                    RDP_Theming = data.RDP_Theming,
                    RDP_FontSmoothing = data.RDP_FontSmoothing,
                    RDP_FullWindowDrag = data.RDP_FullWindowDrag,
                    RDP_DesktopComposition = data.RDP_DesktopComposition,
                    RDP_MenuAnimations = data.RDP_MenuAnimations
                };

                result.Status = MESSAGE_STATUS.OK;
                result.Attachment = viewModel;
            }
            catch(Exception e)
            {
                result.Status = MESSAGE_STATUS.ERROR;
                result.Message = e.Message;
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetSSH([FromQuery] string macAddress)
        {
            await Task.Yield();

            //To be continue...
            return Ok(new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Attachment = new { }
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetVNC([FromQuery] string macAddress)
        {
            await Task.Yield();

            //To be continue...
            return Ok(new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Attachment = new { }
            });
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] PutHostPreferenceViewModel data)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                int affectedRows = 0;
                var oldData = await this._hostPreferenceRepository.GetAsync(data.MacAddress);
                var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
                if (oldData == null)
                {
                    affectedRows = await this._hostPreferenceRepository.AddAsync(new AddHostPreferenceCondition
                    {
                        MacAddress = data.MacAddress,
                        RDP_Wallpaper = data.RDP_Wallpaper,
                        RDP_Theming = data.RDP_Theming,
                        RDP_FontSmoothing = data.RDP_FontSmoothing,
                        RDP_FullWindowDrag = data.RDP_FullWindowDrag,
                        RDP_DesktopComposition = data.RDP_DesktopComposition,
                        RDP_MenuAnimations = data.RDP_MenuAnimations,
                        CreateId = userData.LocalID,
                        CreateDatetime = DateTime.Now
                    });
                }
                else
                {
                    affectedRows = await this._hostPreferenceRepository.UpdateAsync(new UpdateHostPreferenceCondition
                    {
                        MacAddress = data.MacAddress,
                        RDP_Wallpaper = data.RDP_Wallpaper,
                        RDP_Theming = data.RDP_Theming,
                        RDP_FontSmoothing = data.RDP_FontSmoothing,
                        RDP_FullWindowDrag = data.RDP_FullWindowDrag,
                        RDP_DesktopComposition = data.RDP_DesktopComposition,
                        RDP_MenuAnimations = data.RDP_MenuAnimations,
                        UpdateId = userData.LocalID,
                        UpdateDatetime = DateTime.Now
                    });
                }

                result.Status = MESSAGE_STATUS.OK;
                result.Attachment = affectedRows;
            }
            catch(Exception e)
            {
                result.Status = MESSAGE_STATUS.ERROR;
                result.Message = e.Message;
            }

            return Ok(result);
        }

        [HttpDelete]
        public async Task<IActionResult> Delete([FromQuery] string macAddress)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                var affectedRows = await this._hostPreferenceRepository.DeleteAsync(macAddress);

                result.Status = MESSAGE_STATUS.OK;
                result.Attachment = affectedRows;
            }
            catch (Exception e)
            {
                result.Status = MESSAGE_STATUS.ERROR;
                result.Message = e.Message;
            }

            return Ok(result);
        }
    }
}
