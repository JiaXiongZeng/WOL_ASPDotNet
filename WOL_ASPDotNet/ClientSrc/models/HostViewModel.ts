export type HostViewModel =
{
    HostName: string, 
    Domain: string, 
    IPv4: string, 
    IPv6?: string
    MacAddress: string, 
    WOL_Port: number, 
    PowerOn: boolean
}