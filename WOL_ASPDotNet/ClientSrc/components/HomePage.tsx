﻿import React, { useState, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';


import AppBar from '@mui/material/AppBar';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import ComputerIcon from '@mui/icons-material/Computer';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';

import HostList from '@components/HostList';
import ConfigTable from '@components/ConfigTable';
import MaintainHosts from '@components/MaintainHosts';
import UserManagement from '@components/UserManagement';
import UserProfile from '@components/UserProfile';

import axios from 'axios';
import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';
import { AuthContext, AuthDispatchContext, AuthActionKind } from '@components/AuthContext';



type ApiResponse = ResponseMessage<any>;

export default function MenuAppBar() {
    const [anchorEl, setAnchorEl] = useState<Nullable<HTMLElement>>(null);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

    const navigate = useNavigate();

    const navigateTo = (route: string) => {
        navigate(route, { replace: true});
        setDrawerOpen(false);
    }

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const dispatch = useContext(AuthDispatchContext);

    const userInfo = useContext(AuthContext);

    //Redirect to login page if not authorized
    axios.interceptors.response.use(undefined, error => {
        if (error.response.status == 401 || error.response.status == 403) {
            navigateTo("/Login");
            return Promise.reject(error);
        }
    });

    return (
        <>
            <Box sx={{ 
                display: 'flex',
                flexGrow: 1 
            }}>
                <AppBar position="fixed" sx={{
                    backgroundColor: "#03AED2",
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }} >
                    <Toolbar>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            sx={{ mr: 2 }}
                            onClick={() => { setDrawerOpen(!drawerOpen); } }
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: "pointer" }}
                            onClick={(_e) => {
                                navigateTo("/");
                            }}>
                            WOL ASP.NET Core
                        </Typography>
                        <Typography>
                            {userInfo && userInfo.UserName}
                        </Typography>
                        <div>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => {
                                    handleClose();
                                    navigateTo("/UserProfile");
                                }}>
                                    Profile
                                </MenuItem>

                                <MenuItem onClick={() => {
                                    handleClose();

                                    axios.post<ApiResponse>("/Identity/Logout", null, {
                                        responseType: "json"
                                    }).then(resp => {
                                        const respData = resp.data;
                                        if (respData.Status = MESSAGE_STATUS.OK) {
                                            dispatch!({
                                                actionKind: AuthActionKind.CLEAR,
                                                args: null
                                            });

                                            navigateTo("/Login");
                                        }
                                    });
                                }}>Log out</MenuItem>
                            </Menu>
                        </div>
                        
                    </Toolbar>
                </AppBar>

                <Drawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={() => { setDrawerOpen(false); }}
                >
                    <Toolbar />
                    <List>
                        <ListItem key="MaintainHosts" disablePadding={true}>
                            <ListItemButton onClick={
                                (_e) => {
                                    navigateTo("/Maintain");
                                }
                            } >
                                <ListItemIcon>
                                    <ComputerIcon />
                                </ListItemIcon>
                                <ListItemText primary="Maintain Hosts" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                    <List>
                        <ListItem key="UserManagement" disablePadding={true}>
                            <ListItemButton onClick={
                                (_e) => {
                                    navigateTo("/Users");
                                }
                            } >
                                <ListItemIcon>
                                    <PeopleIcon />
                                </ListItemIcon>
                                <ListItemText primary="User Management" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                    <Divider />
                    <List>
                        <ListItem key="Configuration" disablePadding={true}>
                            <ListItemButton onClick={
                                (_e) => {
                                    navigateTo("/Config");
                                }
                            }>
                                <ListItemIcon>
                                    <SettingsIcon />
                                </ListItemIcon>
                                <ListItemText primary="System Settings" />
                            </ListItemButton>
                        </ListItem>
                    </List>                    
                </Drawer>                
            </Box>

            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Routes>
                    <Route path="/" element={<HostList showAction={true} />} />
                    <Route path="/Config" element={<ConfigTable />} />
                    <Route path="/Maintain" element={<MaintainHosts />} />
                    <Route path="/Users" element={<UserManagement />} />
                    <Route path="/UserProfile" element={<UserProfile />} />
                    <Route path="*" element={<HostList showAction={true} />} />
                </Routes>
            </Box>        
        </>        
    );
}