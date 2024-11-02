export type HostViewModel =
{
    HostName: string, 
    Domain: string, 
    IPv4: string, 
    IPv6?: string
    MacAddress: string, 
    WOL_Port: number, 
    PowerOn: boolean,
    RDP_Conn: Nullable<CredentialBaseSettings>,
    SSH_Conn: Nullable<SSH_Settings>,
    VNC_Conn: Nullable<VNC_Settings>
}

interface CredentialBaseSettings
{
    Port: Nullable<number>,
    UserName: Nullable<string>,
    Password: Nullable<string>
}

export interface RDP_Settings extends CredentialBaseSettings
{
    Domain: Nullable<string>
}

export interface SSH_Settings extends CredentialBaseSettings { }

export interface VNC_Settings extends CredentialBaseSettings { }