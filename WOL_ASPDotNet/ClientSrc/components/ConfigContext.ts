import { createContext, Dispatch } from 'react';
import { Configurations } from '@models/Configurations';

export const ConfigContext = createContext<Nullable<Configurations>>(null);

export const ConfigDispatchContext = createContext<Nullable<Dispatch<ConfigAction>>>(null);

export enum ConfigActionKind {
    SET = 'SET',
    CLEAR = 'CLEAR'
}

export interface ConfigAction {
    actionKind: ConfigActionKind,
    args: Nullable<any[]>
}

export const ConfigReducer = (state: Nullable<Configurations>, action: ConfigAction) => {
    const { actionKind, args } = action;

    switch (actionKind) {
        case ConfigActionKind.CLEAR:
            return null;
        case ConfigActionKind.SET:
            if (args != null && args.length > 0) {
                return args[0] as Nullable<Configurations>;
            }
            return state;
        default:
            return state;
    }
}