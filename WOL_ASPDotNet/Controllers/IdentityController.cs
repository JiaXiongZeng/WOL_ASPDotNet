using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WOL_ASPDotNet.Infrastructure.Base;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Implement;

namespace WOL_ASPDotNet.Controllers
{
    public class IdentityController: BaseController
    {
        private IUserRepository _userRepository;

        public IdentityController(IUserRepository userRepository)
        {
            this._userRepository = userRepository;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginCredential credential)
        {
            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            string id = credential.UserID;
            string pwd = SecurityUtility.HashMD5(credential.Password);

            var userData = await this._userRepository.GetLocalAsync(id, pwd);
            if (userData != null)
            {
                Session[SessionKeys.USER_INFO] = userData;


                var viewModel = new UserInfo
                {
                    LocalID = userData.LocalID,
                    OAuthID = userData.OAuthID,
                    UserName = userData.UserName,
                    Email = userData.Email,
                    Phone = userData.Phone,
                    IsAdmin = userData.IsAdmin
                };

                respMsg = new ResponseMessage
                {
                    Status = MESSAGE_STATUS.OK,
                    Attachment = viewModel
                };
            }
            else
            {
                respMsg.Message = "Account or password are invalid!";
            }

            return Ok(respMsg);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await Task.Yield();

            Session.ClearAll();

            var respMsg = new ResponseMessage 
            {
                Status = MESSAGE_STATUS.OK
            };

            return Ok(respMsg);
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetLoginUserInfo()
        {
            await Task.Yield();

            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
            if (userData != null)
            {
                var viewModel = new UserInfo
                {
                    LocalID = userData.LocalID,
                    OAuthID = userData.OAuthID,
                    UserName = userData.UserName,
                    Email = userData.Email,
                    Phone = userData.Phone,
                    IsAdmin = userData.IsAdmin
                };

                respMsg.Status = MESSAGE_STATUS.OK;
                respMsg.Attachment = viewModel;                
            }

            return Ok(respMsg);
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<bool> IsSessionAlive()
        {
            await Task.Yield();

            var value = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
            return (value != null);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserInfoList()
        {
            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                var userDataModels = await this._userRepository.GetUserInfoListAsync();
                var userInfos = userDataModels.Select(x => new UserInfoDetailed
                {
                    LocalID = x.LocalID,
                    LocalPWD = x.LocalPWD,
                    OAuthID = x.OAuthID,
                    UserName = x.UserName,
                    Email = x.Email,
                    Phone = x.Phone,
                    IsAdmin = x.IsAdmin,
                    Status = x.Status
                });

                respMsg.Status = MESSAGE_STATUS.OK;
                respMsg.Attachment = userInfos;
            }
            catch (Exception e)
            {
                respMsg.Status = MESSAGE_STATUS.ERROR;
                respMsg.Message = e.Message;
            }

            return Ok(respMsg);
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetLoginUserInfoDetailed()
        {
            await Task.Yield();

            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
            if (userData != null)
            {
                var viewModel = new UserInfoDetailed
                {
                    LocalID = userData.LocalID,
                    LocalPWD = userData.LocalPWD,
                    OAuthID = userData.OAuthID,
                    UserName = userData.UserName,
                    Email = userData.Email,
                    Phone = userData.Phone,
                    IsAdmin = userData.IsAdmin,
                    Status = userData.Status
                };

                respMsg.Status = MESSAGE_STATUS.OK;
                respMsg.Attachment = viewModel;
            }

            return Ok(respMsg);
        }
    }
}
