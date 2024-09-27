using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Transactions;
using WOL_ASPDotNet.Infrastructure.Base;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;

namespace WOL_ASPDotNet.Controllers
{
    [Authorize]
    public class UserManagementController : BaseController
    {
        private readonly IUserRepository _userRepository;

        public UserManagementController(
            IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpPut]
        public async Task<IActionResult> UpdateUsers([FromBody] IEnumerable<UserInfoDetailed> data)
        {
            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            if (data == null || !data.Any())
            {
                respMsg.Message = "No userInfo populated in the request body!";
                return BadRequest(respMsg);
            }

            var localIds = data.Select(x => x.LocalID).Distinct();

            var savedUserInfos = await _userRepository.GetUserInfoListAsync(localIds);

            //Convert to data models
            var dataModels = data.Select(x => new UserDataModel
            {
                LocalID = x.LocalID,
                LocalPWD = x.LocalPWD,
                UserName = x.UserName,
                Email = x.Email,
                Phone = x.Phone,
                IsAdmin = x.IsAdmin,
                Status = x.Status
            });

            DateTime currentDTM = DateTime.Now;
            var updateOnes = new List<UserDataModel>();
            var insertOnes = new List<UserDataModel>();


            foreach (var record in dataModels)
            {
                if (savedUserInfos.Any(x => x.LocalID == record.LocalID))
                {
                    //Update Rule
                    record.Modifytime = currentDTM;
                    updateOnes.Add(record);
                }
                else
                {
                    //Insert Rule
                    record.Createtime_LocalID = currentDTM;
                    insertOnes.Add(record);
                }
            }

            using (var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                try
                {
                    int insetedCount = 0;
                    int updatedCount = 0;

                    //Update record
                    if (insertOnes.Any())
                    {
                        insetedCount = await _userRepository.InsertUserInfosAsync(insertOnes);
                    }

                    //Insert record
                    if (updateOnes.Any())
                    {
                        updatedCount = await _userRepository.UpdateUserInfosAsync(updateOnes);
                    }                    

                    respMsg.Status = MESSAGE_STATUS.OK;
                    respMsg.Attachment = insetedCount + updatedCount;

                    //Commit
                    scope.Complete();
                }
                catch (Exception e)
                {
                    respMsg.Status = MESSAGE_STATUS.ERROR;
                    respMsg.Message = e.Message;

                    //Rollback
                    scope.Dispose();
                }
            }

            return Ok(respMsg);
        }
    }
}
