using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Net.NetworkInformation;
using WOL_ASPDotNet.Utilities.Interface;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Models.Parameters;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Utilities.Implement;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Infrastructure.Base;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Infrastructure.DependencyInjections;

namespace WOL_ASPDotNet.Controllers
{
    [Authorize]
    public class HostController : BaseController
    {
        private IConfigurationRepository _configRep;
        private IHostRepository _hostRep;
        private IICMPUtility _icmpUtility;
        private IArpSniffer _arpSniffer;
        private IWolUtility _wolUtility;
        private INetworkDevices _networkDevices;

        public HostController(                
                IConfigurationRepository configRep,
                IHostRepository hostRep,
                IICMPUtility icmpUtility,
                IArpSniffer arpSniffer,
                IWolUtility wolUtility,
                INetworkDevices devices
            )
        {
            this._configRep = configRep;
            this._hostRep = hostRep;
            this._icmpUtility = icmpUtility;
            this._arpSniffer = arpSniffer;
            this._wolUtility = wolUtility;
            this._networkDevices = devices;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Index()
        {
            await Task.Yield();
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> SniffHostsOnNetwork()
        {
            await Task.Yield();

            if (!_arpSniffer.IsDeviceSet)
            {
                string deviceId = NamedTimerService.CurrentConfiguration.NetworkDevice; //await this._configRep.GetNetworkDeviceID();
                _arpSniffer.SetDevice(deviceId);
            }

            if (!_arpSniffer.IsStarted)
            {
                _arpSniffer.StartCapture();                
            }

            if (_arpSniffer.IsStarted)
            {
                _arpSniffer.SendArpBroadcast();
            }

            return new EmptyResult();
        }

        [HttpGet]
        public async Task<IActionResult> PingInternal([FromQuery] PingInternalParam param)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            if (param == null || string.IsNullOrEmpty(param.IPv4) || string.IsNullOrEmpty(param.Mac))
            {
                result.Message = "Both IPv4 & Mac can't be empty";
                return BadRequest(result);
            }

            if (!_icmpUtility.IsDeviceSet)
            {
                string deviceId = NamedTimerService.CurrentConfiguration.NetworkDevice; //await this._configRep.GetNetworkDeviceID();
                _icmpUtility.SetDevice(deviceId);
            }

            if (!_icmpUtility.IsStarted) 
            {
                _icmpUtility.StartCapture();
            }

            if (_icmpUtility.IsStarted)
            {
                var responseInfo = await _icmpUtility.PingInternal(param.IPv4, param.Mac);

                if (responseInfo != null)
                {
                    result.Status = MESSAGE_STATUS.OK;
                    result.Attachment = responseInfo;
                }
                else
                {
                    result.Status = MESSAGE_STATUS.ERROR;
                    result.Message = "Time out";
                }
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> WakeOnLan([FromBody] WakeOnLanParam param)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.ERROR
            };

            if (!_wolUtility.IsDeviceSet)
            {
                string deviceId = NamedTimerService.CurrentConfiguration.NetworkDevice; //await this._configRep.GetNetworkDeviceID();
                _wolUtility.SetDevice(deviceId);
            }

            if (_wolUtility.IsDeviceSet)
            {
                try
                {
                    await _wolUtility.WakeUpAsync(new WakeOnLanInfo
                    {
                        macAddress = PhysicalAddress.Parse(param.macAddress),
                        port = param.port
                    });

                    result.Status = MESSAGE_STATUS.OK;
                }
                catch (Exception e)
                {
                    result.Status = MESSAGE_STATUS.ERROR;
                    result.Message = e.Message;
                }                
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetArpEchoHostList([FromQuery] ListFilterParam param)
        {
            var hostList = this._arpSniffer.hostList.Values.AsEnumerable();

            //Exclude the hosts have been added to the power-on host list
            var powerOnHostList = await this._hostRep.GetHostList();
            var powerOnMacList = powerOnHostList.Select(x => x.MacAddress);
            hostList = hostList.Where(x => !powerOnMacList.Contains(x.Mac)).ToList();

            var result = hostList.applyFilter(param);

            var respMessage = new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Attachment = result
            };

            return Ok(respMessage);
        }

        [HttpGet]
        public async Task<IActionResult> GetDeviceList()
        {
            await Task.Yield();

            var deviceList = _networkDevices.getDeviceInfoList();

            return Ok(deviceList);
        }

        [HttpGet]
        public async Task<IActionResult> GetPowerOnHostList()
        {
            var result = await this._hostRep.GetHostList();
            
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> AddToMyHostList([FromBody] IEnumerable<HostInfo> hosts)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.NONE
            };


            if (hosts == null || hosts.Count() == 0)
            {
                result.Status = MESSAGE_STATUS.ERROR;
                result.Message = "";
                return BadRequest(result);
            }

            var list = await this._hostRep.GetHostList();
            int maxSN = list.DefaultIfEmpty().Max(p => p == null ? 0 : p.SN);

            var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
            var datetimeNow = DateTime.Now;
            var hostData = hosts.Select((x, index) => new HostDataModel
            {
                HostName = "",
                Domain = x.HostName,
                IPv4 = x.IPv4,
                IPv6 = x.IPv6,
                MacAddress = x.Mac,
                WOL_Port = 9,  //The default port number of WOL is 9
                SN = (maxSN + index + 1),
                CreateId = userData.LocalID,
                CreateDatetime = datetimeNow
            });

            int savedCount = await this._hostRep.AddToHostList(hostData);

            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Message = $"{savedCount} hosts was added to my host list"
            };

            return Ok(respMsg);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateMyHostList([FromBody] IEnumerable<UpdateHostInfo> hosts)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.NONE
            };

            if (hosts == null || hosts.Count() == 0)
            {
                result.Status = MESSAGE_STATUS.ERROR;
                result.Message = "";
                return BadRequest(result);
            }

            var userData = Session.Get<UserDataModel>(SessionKeys.USER_INFO);
            var datetimeNow = DateTime.Now;
            var hostData = hosts.Select(x => new HostDataModel
            {
                MacAddress = x.MacAddress,
                HostName = x.HostName,
                Domain = x.Domain,
                IPv4 = x.IPv4,
                WOL_Port = x.WOL_Port,
                UpdateId = userData.LocalID,
                UpdateDatetime = datetimeNow
            });

            int updatedCount = await this._hostRep.UpdateHostList(hostData);

            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Message = $"{updatedCount} hosts has been updated successfully"
            };

            return Ok(respMsg);
        }

        [HttpPost]
        public async Task<IActionResult> DeleteMyHostList([FromBody] IEnumerable<DeleteHostInfo> hosts)
        {
            var result = new ResponseMessage
            {
                Status = MESSAGE_STATUS.NONE
            };

            if (hosts == null || hosts.Count() == 0)
            {
                result.Status = MESSAGE_STATUS.ERROR;
                result.Message = "";
                return BadRequest(result);
            }

            var hostData = hosts.Select(x => new HostDataModel
            {
                MacAddress = x.MacAddress
            });

            int deletedCount = await this._hostRep.DeleteHostList(hostData);

            var respMsg = new ResponseMessage
            {
                Status = MESSAGE_STATUS.OK,
                Message = $"{deletedCount} hosts has been deleted successfully"
            };

            return Ok(respMsg);
        }
    }
}
