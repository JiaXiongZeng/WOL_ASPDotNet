import { createContext, Dispatch } from 'react';
import { UserInfo } from '@models/UserInfo';

export const AuthContext = createContext<Nullable<UserInfo>>(null);

export const AuthDispatchContext = createContext<Nullable<Dispatch<AuthAction>>>(null);

export enum AuthActionKind {
    SET = 'SET',
    CLEAR = 'CLEAR'
}

export interface AuthAction {
    actionKind: AuthActionKind,
    args: Nullable<any[]>
}

export const AuthReducer = (state: Nullable<UserInfo>, action: AuthAction) =>
{
    const { actionKind, args } = action;
    
    switch (actionKind) {
        case AuthActionKind.CLEAR:
            return null;
        case AuthActionKind.SET:
            if (args != null && args.length > 0) {
                return args[0] as Nullable<UserInfo>;
            }
            return state;
        default:
            return state;
    }
}