﻿import { useReducer } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import theme from '@utilities/styles/CustomizedTheme';

import { AuthContext, AuthDispatchContext, AuthReducer } from '@components/AuthContext';
import { ConfigContext, ConfigDispatchContext, ConfigReducer } from '@components/ConfigContext';
import AuthenticationRequired from '@components/AuthenticationRequired';

import HomePage from '@components/HomePage';
import LoginScreenLocal from '@components/LoginScreenLocal';

export const HostApp = () => {
    const [configCtx, configDispatch] = useReducer(ConfigReducer, null);
    const [authCtx, authDispatch] = useReducer(AuthReducer, null);

    return (
        <ConfigContext.Provider value={configCtx}>
            <ConfigDispatchContext.Provider value={configDispatch}>
                <AuthContext.Provider value={authCtx}>
                    <AuthDispatchContext.Provider value={authDispatch}>
                        <ThemeProvider theme={theme}>
                            <BrowserRouter>
                                <CssBaseline />
                                <Routes>
                                    <Route path="/Login" element={<LoginScreenLocal />} />
                                    <Route element={<AuthenticationRequired />}>
                                        <Route path="*" element={<HomePage />} />
                                    </Route>
                                </Routes>
                            </BrowserRouter>
                        </ThemeProvider>
                    </AuthDispatchContext.Provider>
                </AuthContext.Provider>
            </ConfigDispatchContext.Provider>        
        </ConfigContext.Provider>
    );
}