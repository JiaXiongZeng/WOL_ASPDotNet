using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mail;
using WOL_ASPDotNet.Infrastructure.Base;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Controllers
{
    [Authorize]
    public class HostCredentialController : BaseController
    {
        private IHostCredentialRepository _hostCredentialRepository;
        private IKeyRingRepository _keyRingRepository;
        private ICryptoUtility _cryptoUtility;


        public HostCredentialController(
            IHostCredentialRepository hostCredentialRepository,
            IKeyRingRepository keyRingRepository,
            ICryptoUtility cryptoUtility) 
        {
            this._hostCredentialRepository = hostCredentialRepository;
            this._keyRingRepository = keyRingRepository;
            this._cryptoUtility = cryptoUtility;
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
                var data = await this._hostCredentialRepository.GetAsync(macAddress);
                if (data == null)
                {
                    result.Status = MESSAGE_STATUS.OK;
                    return Ok(result);
                }

                var RDP_Passwrod = data.RDP_Password;
                var SSH_Password = data.SSH_Password;
                var VNC_Password = data.VNC_Password;

                //Check if the private/public key pair exists
                var keyPair = await this._keyRingRepository.GetHostCredentialKeyPairAsync(macAddress);
                if (keyPair != null)
                {
                    this._cryptoUtility.ImportKeys(keyPair.PrivateKey, keyPair.PublicKey);
                    RDP_Passwrod = (!string.IsNullOrEmpty(RDP_Passwrod) ?
                                            this._cryptoUtility.Decrypt(RDP_Passwrod) : null);
                    SSH_Password = (!string.IsNullOrEmpty(SSH_Password) ?
                                            this._cryptoUtility.Decrypt(SSH_Password) : null);
                    VNC_Password = (!string.IsNullOrEmpty(VNC_Password) ?
                                            this._cryptoUtility.Decrypt(VNC_Password) : null);
                }                

                var viewModel = new HostCredentialViewModel
                {
                    MacAddress = data.MacAddress,
                    RDP_Port = data.RDP_Port,
                    RDP_Domain = data.RDP_Domain,
                    RDP_UserName = data.RDP_UserName,
                    RDP_Password = RDP_Passwrod,
                    SSH_Port = data.SSH_Port,
                    SSH_UserName = data.SSH_UserName,
                    SSH_Password = SSH_Password,
                    VNC_Port = data.VNC_Port,
                    VNC_UserName = data.VNC_UserName,
                    VNC_Password = VNC_Password,
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
                var data = await this._hostCredentialRepository.GetAsync(macAddress);
                if (data == null)
                {
                    result.Status = MESSAGE_STATUS.OK;
                    return Ok(result);
                }

                var RDP_Passwrod = data.RDP_Password;

                //Check if the private/public key pair exists
                var keyPair = await this._keyRingRepository.GetHostCredentialKeyPairAsync(macAddress);
                if (keyPair != null)
                {
                    this._cryptoUtility.ImportKeys(keyPair.PrivateKey, keyPair.PublicKey);
                    RDP_Passwrod = (!string.IsNullOrEmpty(RDP_Passwrod) ?
                                            this._cryptoUtility.Decrypt(RDP_Passwrod) : null);
                }

                var viewModel = new CredentialRdpViewModel
                {
                    Port = data.RDP_Port,
                    Domain = data.RDP_Domain,
                    UserName = data.RDP_UserName,
                    Password = RDP_Passwrod
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
        public async Task<IActionResult> GetSSH([FromQuery] string macAddress)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                var data = await this._hostCredentialRepository.GetAsync(macAddress);
                if (data == null)
                {
                    result.Status = MESSAGE_STATUS.OK;
                    return Ok(result);
                }

                var SSH_Password = data.SSH_Password;

                //Check if the private/public key pair exists
                var keyPair = await this._keyRingRepository.GetHostCredentialKeyPairAsync(macAddress);
                if (keyPair != null)
                {
                    this._cryptoUtility.ImportKeys(keyPair.PrivateKey, keyPair.PublicKey);
                    SSH_Password = (!string.IsNullOrEmpty(SSH_Password) ?
                                            this._cryptoUtility.Decrypt(SSH_Password) : null);
                }

                var viewModel = new CredentialSshViewModel
                {
                    Port = data.SSH_Port,
                    UserName = data.SSH_UserName,
                    Password = SSH_Password
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
        public async Task<IActionResult> GetVNC([FromQuery] string macAddress)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                var data = await this._hostCredentialRepository.GetAsync(macAddress);
                if (data == null)
                {
                    result.Status = MESSAGE_STATUS.OK;
                    return Ok(result);
                }

                var VNC_Password = data.VNC_Password;

                //Check if the private/public key pair exists
                var keyPair = await this._keyRingRepository.GetHostCredentialKeyPairAsync(macAddress);
                if (keyPair != null)
                {
                    this._cryptoUtility.ImportKeys(keyPair.PrivateKey, keyPair.PublicKey);
                    VNC_Password = (!string.IsNullOrEmpty(VNC_Password) ?
                                            this._cryptoUtility.Decrypt(VNC_Password) : null);
                }

                var viewModel = new CredentialVncViewModel
                {
                    Port = data.VNC_Port,
                    UserName = data.VNC_UserName,
                    Password = VNC_Password
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

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] PutHostCredentialViewModel data)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                int affectedRows = 0;
                var oldData = await this._hostCredentialRepository.GetAsync(data.MacAddress);
                var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
                if (oldData == null)
                {
                    var cypher_RDP_Pwd = data.RDP_Password;
                    var cypher_SSH_Pwd = data.SSH_Password;
                    var cypher_VNC_Pwd = data.VNC_Password;

                    var keyPair = await this._keyRingRepository.GenHostCredentialKeyPairAsync(
                                            new GenHostCredentialKeyPairCondition
                                            {
                                                MacAddress = data.MacAddress,
                                                LoginId = userData.LocalID
                                            });
                    //Check if the private/public key pair exists
                    if (keyPair != null)
                    {
                        this._cryptoUtility.ImportKeys(keyPair?.PrivateKey, keyPair?.PublicKey);
                        cypher_RDP_Pwd = (!string.IsNullOrEmpty(cypher_RDP_Pwd) ?
                                                  this._cryptoUtility.Encrypt(cypher_RDP_Pwd) : null);
                        cypher_SSH_Pwd = (!string.IsNullOrEmpty(cypher_SSH_Pwd) ?
                                                  this._cryptoUtility.Encrypt(cypher_SSH_Pwd) : null);
                        cypher_VNC_Pwd = (!string.IsNullOrEmpty(cypher_VNC_Pwd) ?
                                                  this._cryptoUtility.Encrypt(cypher_VNC_Pwd) : null);
                    }                    

                    affectedRows = await this._hostCredentialRepository.AddAsync(new AddHostCredentialCondition
                    {
                        MacAddress = data.MacAddress,
                        RDP_Port = data.RDP_Port,
                        RDP_Domain = data.RDP_Domain,
                        RDP_UserName = data.RDP_UserName,
                        RDP_Password = cypher_RDP_Pwd,
                        SSH_Port = data.SSH_Port,
                        SSH_UserName = data.SSH_UserName,
                        SSH_Password = cypher_SSH_Pwd,
                        VNC_Port = data.VNC_Port,
                        VNC_UserName = data.VNC_UserName,
                        VNC_Password = cypher_VNC_Pwd,
                        CreateId = userData.LocalID,
                        CreateDatetime = DateTime.Now
                    });
                }
                else
                {
                    var keyPairData = await this._keyRingRepository.GetHostCredentialKeyPairAsync(oldData.MacAddress);
                    //Check if the private/public key pair exists
                    //Not exist then create a new pair for the mac address
                    if (keyPairData == null)
                    {
                        var keyPair = await this._keyRingRepository.GenHostCredentialKeyPairAsync(
                        new GenHostCredentialKeyPairCondition
                        {
                            MacAddress = oldData.MacAddress,
                            LoginId = userData.LocalID
                        });

                        keyPairData = new HostCredentialKeyPairDataModel
                        {
                            PrivateKey = keyPair?.PrivateKey,
                            PublicKey = keyPair?.PublicKey
                        };
                    }

                    this._cryptoUtility.ImportKeys(keyPairData.PrivateKey, keyPairData.PublicKey);
                    var cypher_RDP_Pwd = (!string.IsNullOrEmpty(data.RDP_Password) ?
                                                  this._cryptoUtility.Encrypt(data.RDP_Password) : null);
                    var cypher_SSH_Pwd = (!string.IsNullOrEmpty(data.SSH_Password) ?
                                                  this._cryptoUtility.Encrypt(data.SSH_Password) : null);
                    var cypher_VNC_Pwd = (!string.IsNullOrEmpty(data.VNC_Password) ?
                                                  this._cryptoUtility.Encrypt(data.VNC_Password) : null);

                    affectedRows = await this._hostCredentialRepository.UpdateAsync(new UpdateHostCredentialCondition
                    {
                        MacAddress = data.MacAddress,
                        RDP_Port = data.RDP_Port,
                        RDP_Domain = data.RDP_Domain,
                        RDP_UserName = data.RDP_UserName,
                        RDP_Password = cypher_RDP_Pwd,
                        SSH_Port = data.SSH_Port,
                        SSH_UserName = data.SSH_UserName,
                        SSH_Password = cypher_SSH_Pwd,
                        VNC_Port = data.VNC_Port,
                        VNC_UserName = data.VNC_UserName,
                        VNC_Password = cypher_VNC_Pwd,
                        UpdateId = userData.LocalID,
                        UpdateDatetime = DateTime.Now
                    });
                }

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

        [HttpDelete]
        public async Task<IActionResult> Delete([FromQuery] string macAddress)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            try
            {
                var affectedRows = await this._hostCredentialRepository.DeleteAsync(macAddress);
                affectedRows += await this._keyRingRepository.RevokeHostCredentialKeyPairAsync(macAddress);

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
