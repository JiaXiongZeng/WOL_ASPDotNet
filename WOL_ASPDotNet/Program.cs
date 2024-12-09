using Vite.AspNetCore;
using WOL_ASPDotNet.Infrastructure.Options;
using WOL_ASPDotNet.Utilities.Implement;
using WOL_ASPDotNet.Utilities.Interface;
using WOL_ASPDotNet.Repository.Interface;
using WOL_ASPDotNet.Repository.Implement;
using WOL_ASPDotNet.Infrastructure.Authorizations.Scheme;
using WOL_ASPDotNet.Infrastructure.DependencyInjections;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Set logging feature
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Set MVC & JSON serilization configurations
builder.Services.AddControllersWithViews(options => {
                    //options.Filters.Add<AuthorizationFilter>();
                })
                .AddJsonOptions(jsonOptions => {
                    jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = null;
                });

//Set the connection string with option pattern
builder.Services.Configure<ConnectionOption>(option =>
{
    option.SQLite = builder.Configuration.GetValue<string>("ConnectionStrings:SQLite");
    option.KeyRing = builder.Configuration.GetValue<string>("ConnectionStrings:KeyRing");
});


/*********************************** Enable Session ***********************************/
string sessionMode = builder.Configuration.GetValue<string>("SessionMode");
switch (sessionMode)
{
    case "Redis":
        var RedisHost = builder.Configuration.GetValue<string>("RedisSettings:Host");
        if (string.IsNullOrEmpty(RedisHost))
        {
            throw new ArgumentException("The appsettings.json must specify the config 'RedisSettings:Host'");
        }

        var InstanceName = builder.Configuration.GetValue<string>("RedisSettings:InstanceName");
        if (string.IsNullOrEmpty(InstanceName))
        {
            throw new ArgumentException("The appsettings.json must specify the config 'RedisSettings:InstanceName'");
        }

        builder.Services.AddStackExchangeRedisCache(option => {
            option.Configuration = RedisHost;
            option.InstanceName = InstanceName;
        });
        break;
    case "InProc":
    default:
        builder.Services.AddDistributedMemoryCache();
        break;
}

builder.Services.AddSession(option =>
{
    option.Cookie.Name = "AspCoreWOL-SessionId";
    option.IdleTimeout = TimeSpan.FromMinutes(60);
    option.Cookie.HttpOnly = true;
    option.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    option.Cookie.SameSite = SameSiteMode.Strict;
    option.Cookie.IsEssential = true;
});

//Use session token authentication method
//Ref. ~/Infrastructure/Authorizations/Scheme
builder.Services.AddAuthentication(SessionTokenAuthDefaults.AuthenticationScheme)
                .AddScheme<SessionTokenAuthSchemeOptions, SessionTokenAuthSchemeHandler>(
                    SessionTokenAuthDefaults.AuthenticationScheme,
                    option => { }
                 );
/******************************************************************************************************/

builder.Services.AddViteServices();

//Dependency Injections
//Utilities
builder.Services.AddSingleton<IDBConnectionHelper, DBConnectionHelper>();
builder.Services.AddSingleton<INetworkDevices, NetworkDevices>();
builder.Services.AddSingleton<INamedTimerPool, NamedTimerPool>();
builder.Services.AddSingleton<IIdentifierGenerator, IdentifierGenerator>();
builder.Services.AddSingleton<IArpSniffer, ArpSniffer>();
builder.Services.AddSingleton<IICMPUtility, ICMPUtility>();
builder.Services.AddSingleton<IWolUtility, WolUtility>();
//Repositories
builder.Services.AddSingleton<IConfigurationRepository, ConfigurationRepository>();
builder.Services.AddSingleton<ICacheHostRepository, CacheHostRepository>();
builder.Services.AddScoped<IHostRepository, HostRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICryptoUtility, CryptoUtility>();
builder.Services.AddScoped<IKeyRingRepository, KeyRingRepository>();
builder.Services.AddScoped<IHostCredentialRepository, HostCredentialRepository>();
builder.Services.AddScoped<IHostPreferenceRepository, HostPreferenceRepository>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseViteDevelopmentServer(true);
} 
else
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

//app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.MapControllerRoute(
    name: "API",
    pattern: "{controller}/{action}/{any?}");

app.MapControllerRoute(
    name: "HostSPA",
    pattern: "{*more}",
    defaults: new { controller = "Host", action = "Index" });

//Enable Session Management
app.UseSession();

//Enable Authentication
app.UseAuthentication();

//Enable Authorization
app.UseAuthorization();


/******************************* 避免密集時間重啟都要重新抓實體網卡位置 *******************************/

//使用快取清除器
app.useCacheClear();

//使用快取傾倒 (存入快取資料庫)
app.useCacheDumpper();

//使用組態監聽器 (監聽頻率0.1分鐘)
app.useConfigMonitor(0.1);

//使用預設的事件處理器
app.useDefaultEventHandlers();

/************************************************************************************************/

app.Run();
