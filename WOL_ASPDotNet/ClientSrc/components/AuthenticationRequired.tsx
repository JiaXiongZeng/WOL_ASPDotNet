import { useContext, useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext, AuthDispatchContext, AuthActionKind } from '@components/AuthContext';
import { ConfigContext, ConfigDispatchContext, ConfigActionKind } from '@components/ConfigContext';

import { UserInfo } from '@models/UserInfo';
import { Configurations } from '@models/Configurations';
import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';

import axios from 'axios';

type ApiIdentityResponse = ResponseMessage<Nullable<UserInfo>>;
type ApiConfigResponse = ResponseMessage<Nullable<Configurations>>;

export const AuthenticationRequired = () => {
    const authCtx = useContext(AuthContext);    
    const authDispatch = useContext(AuthDispatchContext);    
    const [serverAuth, setServerAuth] = useState<Nullable<UserInfo>>(authCtx);

    const configCtx = useContext(ConfigContext);
    const configDispatch = useContext(ConfigDispatchContext);
    const [serverConfig, setServerConfig] = useState<Nullable<Configurations>>(configCtx);

    const [isRequested, setIsRequested] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        var identityProcess: any;
        var configProcess: any;

        //If reload whole page from server, checking session state first
        if (!serverAuth) {
            //Load Identity infomation
            identityProcess = axios.get<ApiIdentityResponse>('/Identity/GetLoginUserInfo', {
                withCredentials: true,
                responseType: "json"
            }).then(resp => {
                const respData = resp.data;
                if (respData.Status == MESSAGE_STATUS.OK) {
                    authDispatch!({
                        actionKind: AuthActionKind.SET,
                        args: [respData.Attachment]
                    });

                    setServerAuth(respData.Attachment!);
                }
            }).catch((_reason) => {
                setServerAuth(null);                
            });
        }


        //Load Configuration
        if (!serverConfig) {
            configProcess = axios.get<ApiConfigResponse>('/Config/GetBasic', {
                withCredentials: true,
                responseType: "json"
            }).then(resp => {
                const respData = resp.data;
                if (respData.Status == MESSAGE_STATUS.OK) {
                    configDispatch!({
                        actionKind: ConfigActionKind.SET,
                        args: [respData.Attachment]
                    });

                    setServerConfig(respData.Attachment!);
                }
            }).catch((_reason) => {
                setServerConfig(null);
            });
        }
        

        Promise.all([identityProcess, configProcess])
               .finally(() => {
                   setIsRequested(true);
               });

    }, [serverAuth, serverConfig]);

    useEffect(() => {
        //Checking whether there are login information in the session state or not.
        //If no, it presents the session has expired or user nver logged in.
        if (isRequested && (serverAuth == null || serverConfig == null)) {
            navigate("/Login", { replace: true });
        }
    }, [isRequested]);

    return (
        serverAuth ? <Outlet /> : null
    );
}

export default AuthenticationRequired;