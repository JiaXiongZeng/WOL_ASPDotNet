import { useRef } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';

import UserList, { UserListHandler } from '@components/UserList';
import UserAddFormList, { UserAddFormListHandler } from '@components/UserAddFormList';
import UserEditFormList, { UserEditFormListHandler } from '@components/UserEditFormList';
import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';

import { ResponseMessage, MESSAGE_STATUS } from '@models/ResponseMessage';

import axios from 'axios';

type ApiResponse = ResponseMessage<number>;

const UserManagement = () => {
    const userListRef = useRef<UserListHandler>(null);
    const modalAddRef = useRef<CustomizedDialogHandler>(null);
    const userAddFormListRef = useRef<UserAddFormListHandler>(null);
    const modalModificationRef = useRef<CustomizedDialogHandler>(null);
    const userEditFormListRef = useRef<UserEditFormListHandler>(null);
    const modalMessageRef = useRef<CustomizedDialogHandler>(null);

    return (
        <>
            <Box>
                <Typography align="center" variant="h6">
                    User Management
                </Typography>
                <Typography align="right" gutterBottom>
                    <Tooltip arrow title="Add users">
                        <IconButton sx={{ color: "#03AED2" }} onClick={() => {
                            modalAddRef.current?.setOpen(true);
                        }}>
                            <PersonAddIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip arrow title="Edit user profiles">
                        <IconButton sx={{ color: "#03AED2" }} onClick={() => {
                            //console.log(userListRef.current?.GetSelectedUsers());
                            modalModificationRef.current?.setOpen(true);
                        }}  >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                </Typography>
            </Box>
            <UserList ref={userListRef} />
            <CustomizedDialog
                title="User Profiles Modification"
                open={false}
                showClose={true}
                fullWidth={true}
                maxWidth="xl"
                minHeight="90vh"
                actionPanel={
                    <>
                        <Button onClick={async () => {
                            const data = userEditFormListRef.current?.getSubmitData()!;
                            if (data.length > 0) {
                                await axios.put<ApiResponse>('/UserManagement/UpdateUsers', data, {
                                    responseType: "json"
                                }).then(resp => {
                                    const respData = resp.data;
                                    if (respData.Status == MESSAGE_STATUS.OK) {
                                        modalMessageRef.current?.setContentPanel(
                                            <Typography>
                                                {respData.Attachment} Users have been modified
                                            </Typography>
                                        );

                                        //Reload the user list
                                        userListRef.current?.reload();

                                        //Close the user profile modication modal
                                        modalModificationRef.current?.setOpen(false);
                                    } else {
                                        modalMessageRef.current?.setContentPanel(
                                            <Typography>
                                                {respData.Message}
                                            </Typography>
                                        );
                                    }
                                    modalMessageRef.current?.setOpen(true);
                                }).catch(error => {
                                    modalMessageRef.current?.setContentPanel(
                                        <Typography>
                                            {error.message}
                                        </Typography>
                                    );
                                    modalMessageRef.current?.setOpen(true);
                                });
                            }
                        }}>
                            <CheckIcon />
                            <Typography sx={{ marginLeft: 1, marginBottom: 0 }} >
                                Confirm
                            </Typography>
                        </Button>
                    </>
                }
                ref={modalModificationRef}>

                <UserEditFormList refUserList={userListRef} ref={userEditFormListRef}/>
            </CustomizedDialog>

            <CustomizedDialog
                title="Add Users"
                open={false}
                showClose={true}
                fullWidth={true}
                maxWidth="xl"
                minHeight="90vh"
                actionPanel={
                    <Button onClick={async (e) => {
                        //Apply submit and validation
                        const isValid = await userAddFormListRef.current?.getValidationResult(e);
                        if (isValid) {
                            //Get the sumitted data
                            const data = userAddFormListRef.current?.getSubmitData()!;

                            if (data.length > 0) {
                                await axios.put<ApiResponse>('/UserManagement/UpdateUsers', data, {
                                    responseType: "json"
                                }).then(resp => {
                                    const respData = resp.data;
                                    if (respData.Status == MESSAGE_STATUS.OK) {
                                        modalMessageRef.current?.setContentPanel(
                                            <Typography>
                                                {respData.Attachment} Users have been modified
                                            </Typography>
                                        );

                                        //Reload the user list
                                        userListRef.current?.reload();

                                        //Close the add users modal
                                        modalAddRef.current?.setOpen(false);
                                    } else {
                                        modalMessageRef.current?.setContentPanel(
                                            <Typography>
                                                {respData.Message}
                                            </Typography>
                                        );
                                    }
                                    modalMessageRef.current?.setOpen(true);
                                }).catch(error => {
                                    modalMessageRef.current?.setContentPanel(
                                        <Typography>
                                            {error.message}
                                        </Typography>
                                    );
                                    modalMessageRef.current?.setOpen(true);
                                });
                            }
                        }
                    }}>
                        <CheckIcon />
                        <Typography sx={{ marginLeft: 1, marginBottom: 0 }} >
                            Confirm
                        </Typography>
                    </Button>
                }
                ref={modalAddRef}>
                <UserAddFormList withDefaultPassword={true} ref={userAddFormListRef} />
            </CustomizedDialog>

            <CustomizedDialog
                title="Information"
                open={false}
                autoClose={1000}
                ref={modalMessageRef} />
        </>
    );
}

export default UserManagement;