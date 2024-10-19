export type GatewayParametersViewModel = {
    Type: string,    
    GuacamoleSharpWebSocket?: Nullable<string>,
    GuacamoleSharpTokenURL?: Nullable<string>,
    GuacamoleSharpTokenPhrase?: Nullable<string>,
    Ip: string,
    Port?: Nullable<number>,
    Domain?: Nullable<string>,
    UserName?: Nullable<string>,
    Password?: Nullable<string>
}