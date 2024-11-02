export type PutHostCredentailViewModel = {
    MacAddress: string,
    RDP_Port: Nullable<number>,
    RDP_Domain: string,
    RDP_UserName: string,
    RDP_Password: string,
    SSH_Port: Nullable<number>,
    SSH_UserName: string,
    SSH_Password: string,
    VNC_Port: Nullable<number>,
    VNC_UserName: string,
    VNC_Password: string
}