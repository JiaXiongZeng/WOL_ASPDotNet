export type UserInfoViewModel = {
    LocalID: string,
    LocalPWD: string,
    OAuthID: Nullable<string>,    
    UserName: string,
    Email: Nullable<string>,
    Phone: Nullable<string>,
    IsAdmin: boolean,
    Status: 'A' | 'I'
};