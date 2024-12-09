export type GatewayParametersViewModel = {
    Type: 'RDP' | 'SSH' | 'VNC',
    GuacamoleSharpWebSocket?: Nullable<string>,
    GuacamoleSharpTokenURL?: Nullable<string>,
    GuacamoleSharpTokenPhrase?: Nullable<string>,
    Ip: string,
    Port?: Nullable<number>,
    Domain?: Nullable<string>,
    UserName?: Nullable<string>,
    Password?: Nullable<string>,
    RDP_Wallpaper?: Nullable<boolean>,
    RDP_Theming?: Nullable<boolean>,
    RDP_FontSmoothing?: Nullable<boolean>,
    RDP_FullWindowDrag?: Nullable<boolean>,
    RDP_DesktopComposition?: Nullable<boolean>,
    RDP_MenuAnimations?: Nullable<boolean>
}