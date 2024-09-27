using System.Diagnostics;
using WOL_ASPDotNet.Infrastructure.Enums;
using WOL_ASPDotNet.Models.ViewModels;
using WOL_ASPDotNet.Models.Entities;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Utilities.Implement;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Infrastructure.DependencyInjections
{
    public static class NamedTimerService
    {
        /// <summary>
        /// 組態變更事件Handler
        /// </summary>
        /// <param name="oldConfigInfo">舊組態資訊</param>
        /// <param name="newConfigInfo">新組態資訊</param>
        public delegate void ConfigurationChangeHandler(ConfigurationInfo oldConfigInfo, ConfigurationInfo newConfigInfo);

        /// <summary>
        /// 快取失效時間變更事件Handler
        /// </summary>
        /// <param name="timer">失效快取清除器Timer</param>
        /// <param name="oldConfigInfo">舊組態資訊</param>
        /// <param name="newConfigInfo">新組態資訊</param>
        public delegate void CacheExpirationTimespanChangeHandler(NamedTimer timer, ConfigurationInfo oldConfigInfo, ConfigurationInfo newConfigInfo);

        /// <summary>
        /// 快取傾倒時間變更事件Handler
        /// </summary>
        /// <param name="timer">快取傾倒Timer</param>
        /// <param name="oldConfigInfo">舊組態資訊</param>
        /// <param name="newConfigInfo">新組態資訊</param>
        public delegate void CacheDumpTimespanChangeHandler(NamedTimer timer, ConfigurationInfo oldConfigInfo, ConfigurationInfo newConfigInfo);


        /// <summary>
        /// 組態變更事件
        /// </summary>
        public static event ConfigurationChangeHandler OnConfigurationChanged = null;

        /// <summary>
        /// 快取失效時間變更事件
        /// </summary>
        public static event CacheExpirationTimespanChangeHandler OnCacheExpirationTimespanChanged = null;

        /// <summary>
        /// 快取傾倒時間變更事件
        /// </summary>
        public static event CacheDumpTimespanChangeHandler OnCacheDumpTimespanChanged = null;


        private static NamedTimer _clearCacheTimer = null;
        private static NamedTimer _dumpCacheTimer = null;
        private static NamedTimer _configMonitorTimer = null;        
        private static ConfigurationInfo _currentConfiguration = null;
        
        private static INamedTimerPool _timerPool = null;
        private static IConfigurationRepository _configRep = null;

        //防止Monitor Job跟使用者同時在通知快取清除時間變更
        private static readonly object lockerCET = new object();

        //防止Monitor Job跟使用者同時在通知快取傾倒時間變更
        private static readonly object lockerCDT = new object();

        /// <summary>
        /// 取得當下組態的狀態
        /// </summary>
        public static ConfigurationInfo CurrentConfiguration
        {
            get
            {
                return _currentConfiguration;
            }
        }

        /// <summary>
        /// 定期清空過期快取
        /// </summary>
        /// <param name="app"></param>
        /// <returns></returns>
        public static IApplicationBuilder useCacheClear(this IApplicationBuilder app)
        {
            Task.Run(async () => {
                _timerPool = app.ApplicationServices.GetRequiredService<INamedTimerPool>();
                _configRep = app.ApplicationServices.GetRequiredService<IConfigurationRepository>();
                var logger = app.ApplicationServices.GetRequiredService<ILoggerFactory>()
                                                    .CreateLogger<NamedTimer>();
                

                var cacheHost = app.ApplicationServices.GetRequiredService<ICacheHostRepository>();
                var arpSniffer = app.ApplicationServices.GetRequiredService<IArpSniffer>();

                //從組態檔抓取清空快取的區間
                var clearCachePeriod = await _configRep.GetCacheExpirationTimepsan();
                _clearCacheTimer = _timerPool.Register(NamedTimerIDs.CACHE_CLEARER, async (state) =>
                {
                    var expiredTimespan = await _configRep.GetCacheExpirationTimepsan();

                    int dbDelNum = await cacheHost.DeleteExpiredOnes(expiredTimespan);

                    int mmDelNum = await arpSniffer.DeleteExpiredEntries(expiredTimespan);

                    var now = DateTime.Now;
                    string logMsg = $"---------------------Cache Clear---------------------{Environment.NewLine}" +
                                    $"{now} {dbDelNum} database caches deleted!{Environment.NewLine}" +
                                    $"{now} {mmDelNum} memory caches deleted!{Environment.NewLine}" +
                                    "------------------------------------------------------";
                    logger.LogInformation(logMsg);
                }, null, null, clearCachePeriod);
                _clearCacheTimer.Start();
            });

            return app;
        }

        /// <summary>
        /// 定期將快取傾倒回資料庫中
        /// </summary>
        /// <param name="app"></param>
        /// <returns></returns>
        public static IApplicationBuilder useCacheDumpper(this IApplicationBuilder app)
        {
            Task.Run(async() => {
                _timerPool = app.ApplicationServices.GetRequiredService<INamedTimerPool>();
                _configRep = app.ApplicationServices.GetRequiredService<IConfigurationRepository>();
                var logger = app.ApplicationServices.GetRequiredService<ILoggerFactory>()
                                                    .CreateLogger<NamedTimer>();


                var cacheHost = app.ApplicationServices.GetRequiredService<ICacheHostRepository>();
                var arpSniffer = app.ApplicationServices.GetRequiredService<IArpSniffer>();


                //從組態檔抓取傾倒快取到DB的區間
                var dumpPeriod = await _configRep.GetCacheDumpTimespan();
                _dumpCacheTimer = _timerPool.Register(NamedTimerIDs.CACHE_DUMPER, async (state) =>
                {
                    //清空原本資料庫中的Cache
                    int oriAllDeleted = await cacheHost.Delete();

                    //重新從記憶體Cache傾倒到資料庫Cache
                    var hostLists = arpSniffer.hostList.Values.ToList();
                    int newInserted = 0;
                    foreach (var host in hostLists)
                    {
                        newInserted += await cacheHost.Create(new CacheHostDataModel {
                            MacAddress = host.Mac,
                            HostName = host.HostName,
                            IPv4 = host.IPv4,
                            CreateDatetime = host.CreateTime,
                            UpdateDatetime = host.UpdateTime
                        });
                    }

                    var now = DateTime.Now;
                    string logMsg = $"---------------------Cache Dumpper---------------------{Environment.NewLine}" +
                                    $"{now} {oriAllDeleted} removed from previous db cache.{Environment.NewLine}" +
                                    $"{now} {newInserted} inserted into db cache.{Environment.NewLine}" +
                                    "------------------------------------------------------";
                    logger.LogInformation(logMsg);
                }, null, null, dumpPeriod);
                _dumpCacheTimer.Start();
            });

            return app;
        }

        /// <summary>
        /// 定期監控組態檔是否變動則拋出對應事件
        /// </summary>
        /// <param name="app">Application Builder</param>
        /// <param name="period">浮點數 (分鐘)</param>
        /// <returns></returns>
        public static IApplicationBuilder useConfigMonitor(this IApplicationBuilder app, double period = 1)
        {
            Task.Run(async () => {
                _timerPool = app.ApplicationServices.GetRequiredService<INamedTimerPool>();
                _configRep = app.ApplicationServices.GetRequiredService<IConfigurationRepository>();

                //每分鐘監控組態是否變更
                var refreshConfigPeriod = TimeSpan.FromMinutes(period);

                _currentConfiguration = await _configRep.GetConfigurationInfo();
                _configMonitorTimer = _timerPool.Register(NamedTimerIDs.CONFIG_MONITOR, async (state) =>
                {
                    var oldInfo = _currentConfiguration;
                    var newinfo = await _configRep.GetConfigurationInfo();
                    if (!oldInfo.Equals(newinfo))
                    {
                        //觸發組態變更事件
                        if (OnConfigurationChanged != null)
                        {
                            OnConfigurationChanged(oldInfo, newinfo);
                        }

                        //觸發快取失效時間變更事件
                        if (_clearCacheTimer != null)
                        {
                            if (oldInfo.CacheExpirationTimespan != newinfo.CacheExpirationTimespan)
                            {
                                notifyCacheExpirationTimespanChanged(newinfo);
                            }

                            if (oldInfo.CacheDumpTimespan != newinfo.CacheDumpTimespan)
                            {
                                notifyCacheDumpTimespanChanged(newinfo);
                            }
                        }

                        //更新目前的Configuration狀態
                        _currentConfiguration = newinfo;
                    }
                }, null, null, refreshConfigPeriod);
                _configMonitorTimer.Start();
            });

            return app;
        }

        /// <summary>
        /// 使用預設的事件處理器
        /// </summary>
        /// <param name="app">Application Builder</param>
        /// <returns></returns>
        public static IApplicationBuilder useDefaultEventHandlers(this IApplicationBuilder app)
        {
            var loggerA = app.ApplicationServices.GetRequiredService<ILoggerFactory>()
                                                 .CreateLogger<CacheExpirationTimespanChangeHandler>();

            var loggerB = app.ApplicationServices.GetRequiredService<ILoggerFactory>()
                                                 .CreateLogger<CacheDumpTimespanChangeHandler>();

            var loggerC = app.ApplicationServices.GetRequiredService<ILoggerFactory>()
                                                 .CreateLogger<ConfigurationChangeHandler>();

            //當發生快取失效時間變更事件時，更新相關Timer的週期
            NamedTimerService.OnCacheExpirationTimespanChanged += (timer, oldConfig, newConfig) =>
            {
                if (!timer.IsExecuting)
                {
                    if (newConfig.CacheExpirationTimespan.HasValue)
                    {
                        TimeSpan newPeriod = TimeSpan.FromMinutes(newConfig.CacheExpirationTimespan.Value);
                        timer.Period = (long)newPeriod.TotalMilliseconds;

                        loggerA.LogInformation($"{DateTime.Now} Config CacheExpirationTimespan altered!");
                    }
                }
            };

            //當發生快取傾倒時間變更事件時，更新相關Timer的週期
            NamedTimerService.OnCacheDumpTimespanChanged += (timer, oldConfig, newConfig) =>
            {
                if (!timer.IsExecuting)
                {
                    if (newConfig.CacheDumpTimespan.HasValue)
                    {
                        TimeSpan newPeriod = TimeSpan.FromMinutes(newConfig.CacheDumpTimespan.Value);
                        timer.Period = (long)newPeriod.TotalMilliseconds;

                        loggerB.LogInformation($"{DateTime.Now} Config CacheDumpTimespan altered!");
                    }
                }
            };

            //當發生組態調整時，進行對應處理
            NamedTimerService.OnConfigurationChanged += (oldConfig, newConfig) =>
            {
                if (oldConfig.NetworkDevice != newConfig.NetworkDevice)
                {
                    var arpSniffer = app.ApplicationServices.GetRequiredService<IArpSniffer>();
                    var icmpUtil = app.ApplicationServices.GetRequiredService<IICMPUtility>();
                    var wolUtil = app.ApplicationServices.GetRequiredService<IWolUtility>();

                    arpSniffer.Reset();
                    arpSniffer.SetDevice(newConfig.NetworkDevice);

                    icmpUtil.Reset();
                    icmpUtil.SetDevice(newConfig.NetworkDevice);

                    wolUtil.Reset();
                    wolUtil.SetDevice(newConfig.NetworkDevice);

                    loggerC.LogInformation($"{DateTime.Now} Owing to NetworkDevice altered, the related utilities ARP, ICMP and WOL reset!");
                }
            };

            return app;
        }

        public static void notifyCacheExpirationTimespanChanged(ConfigurationInfo newConfigInfo)
        {
            var task = Task.Run(async () => {
                Monitor.Enter(lockerCET);
                try
                {
                    if (_clearCacheTimer == null)
                    {
                        throw new ArgumentNullException("ClearCacheTimer must be initialized, please try to add \"app.useCacheClear\" at program.cs");
                    }

                    if (_currentConfiguration == null)
                    {
                        _currentConfiguration = await _configRep.GetConfigurationInfo();
                    }

                    if (OnCacheExpirationTimespanChanged != null)
                    {
                        if (_currentConfiguration.CacheExpirationTimespan != newConfigInfo.CacheExpirationTimespan)
                        {
                            OnCacheExpirationTimespanChanged(_clearCacheTimer, _currentConfiguration, newConfigInfo);
                        }
                    }

                    //更新目前的Configuration狀態
                    _currentConfiguration.CacheExpirationTimespan = newConfigInfo.CacheExpirationTimespan;
                }
                finally
                {
                    Monitor.Exit(lockerCET);
                }
            });

            Task.WaitAll(task);
        }

        public static void notifyCacheDumpTimespanChanged(ConfigurationInfo newConfigInfo)
        {
            var task = Task.Run(async () => {
                Monitor.Enter(lockerCDT);
                try
                {
                    if (_dumpCacheTimer == null)
                    {
                        throw new ArgumentNullException("DumpCacheTimer must be initialized, please try to add \"app.useCacheDump\" at program.cs");
                    }

                    if (_currentConfiguration == null)
                    {
                        _currentConfiguration = await _configRep.GetConfigurationInfo();
                    }

                    if (OnCacheDumpTimespanChanged != null)
                    {
                        if (_currentConfiguration.CacheDumpTimespan != newConfigInfo.CacheDumpTimespan)
                        {
                            OnCacheDumpTimespanChanged(_dumpCacheTimer, _currentConfiguration, newConfigInfo);
                        }
                    }

                    //更新目前的Configuration狀態
                    _currentConfiguration.CacheDumpTimespan = newConfigInfo.CacheDumpTimespan;
                }
                finally
                {
                    Monitor.Exit(lockerCDT);
                }
            });

            Task.WaitAll(task);
        }
    }
}
