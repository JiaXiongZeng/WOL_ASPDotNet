using System.Net;
using System.Net.Sockets;
using SharpPcap;
using SharpPcap.LibPcap;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public abstract class NetworkTool: INetworkTool
    {
        protected bool _isDisposed = false;
        private CaptureDeviceList _deviceList;
        protected ILiveDevice _device;

        public NetworkTool()
        {
            this._deviceList = CaptureDeviceList.New();
        }

        /// <summary>
        /// 初始化Tool
        /// </summary>
        public virtual void Reset() 
        {
            foreach (var device in this._deviceList)
            {
                if (device != null && device.Started)
                {
                    device.StopCapture();
                }

                if (device != null)
                {
                    device.Dispose();
                }
            }

            this._deviceList = CaptureDeviceList.New();
            _device = null;
        }

        /// <summary>
        /// 設定綁定的網卡
        /// </summary>
        /// <param name="keywords">網卡識別關鍵字</param>
        public virtual void SetDevice(string keywords = null)
        {
            var devices = this._deviceList; //CaptureDeviceList.Instance;

            if (devices.Count == 0)
            {
                throw new ArgumentException("Device not found.");
            }

            //Normalize keyword
            if (!string.IsNullOrEmpty(keywords))
            {
                keywords = keywords.ToLower();
            }


            ILiveDevice device = null;

            if (!string.IsNullOrEmpty(keywords))
            {
                var keywordList = keywords.Split([';', ',']);
                foreach (var keyword in keywordList)
                {
                    device = devices
                        .OfType<LibPcapLiveDevice>()
                        .FirstOrDefault(x => x.Name.ToLower().Contains(keyword) ||
                        (!string.IsNullOrEmpty(x.Interface.FriendlyName) && x.Interface.FriendlyName.ToLower().Contains(keyword)));

                    if (device != null)
                    {
                        break;
                    }
                }
            }

            if (device == null)
            {
                _device = devices.FirstOrDefault();
            }
            else
            {
                _device = device;
            }
        }

        /// <summary>
        /// 是否已經設定網卡裝置
        /// </summary>
        public virtual bool IsDeviceSet
        {
            get
            {
                return _device != null;
            }
        }

        /// <summary>
        /// 開始捕捉封包
        /// </summary>
        public virtual void StartCapture()
        {
            this.StartCaptureWithFilter();
        }

        /// <summary>
        /// 是否已經啟用
        /// </summary>
        public virtual bool IsStarted
        {
            get
            {
                return _device != null && _device.Started;
            }
        }

        /// <summary>
        /// 停止捕捉封包
        /// </summary>
        public virtual void StopCapture()
        {
            if (IsStarted)
            {
                _device.StopCapture();
            }
        }

        /// <summary>
        /// 開始捕捉封包
        /// </summary>
        /// <param name="filter">封包捕捉篩選表示式</param>
        protected void StartCaptureWithFilter(string filter = null)
        {
            if (_device == null)
            {
                throw new ArgumentException("Must specify device first.");
            }
            _device.Open(DeviceModes.Promiscuous, 1000);

            if (!string.IsNullOrEmpty(filter))
            {
                _device.Filter = filter;
            }

            _device.StartCapture();
        }

        /// <summary>
        /// 取得網卡綁定的IPv4
        /// </summary>
        /// <returns></returns>
        protected IPAddress GetNicIpv4Address()
        {
            if (_device == null)
            {
                throw new ArgumentException("Must specify device first.");
            }

            var ipAddress = ((LibPcapLiveDevice)this._device).Interface
                                             .Addresses.FirstOrDefault(x => x.Addr.ipAddress != null && 
                                                                            x.Addr.ipAddress.AddressFamily == AddressFamily.InterNetwork)
                                             .Addr.ipAddress;

            return ipAddress;            
        }

        /// <summary>
        /// 解構子
        /// </summary>
        public void Dispose()
        {
            if (!this._isDisposed)
            {
                foreach (var device in this._deviceList)
                {
                    try
                    {
                        if (device != null && device.Started)
                        {
                            device.StopCapture();
                        }

                        if (device != null)
                        {
                            device.Dispose();
                        }
                    }
                    catch (Exception e)
                    {
                        //Do nothing
                    }
                }
                this._deviceList = null;
                this._device = null;
                this._isDisposed = true;
            }
        }
    }
}
