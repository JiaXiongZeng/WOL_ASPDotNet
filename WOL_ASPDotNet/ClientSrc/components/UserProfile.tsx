import { useEffect, useState, useRef } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import UserEditFormList, { UserEditFormListHandler } from '@components/UserEditFormList';
import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';

import { ResponseMessage, MESSAGE_STATUS } from '@models/ResponseMessage';
import { UserInfoViewModel } from '@models/UserInfoViewModel';

import axios from 'axios';

type ApiGetResponse = ResponseMessage<Nullable<UserInfoViewModel>>;
type ApiSaveResponse = ResponseMessage<number>;

const UserProfile = () => {
    const [userInfoList, setUserInfoList] = useState<UserInfoViewModel[]>([]);
    const userEditFormListRef = useRef<UserEditFormListHandler>(null);
    const modalMessageRef = useRef<CustomizedDialogHandler>(null);

    useEffect(() => {
        axios.get<ApiGetResponse>('/Identity/GetLoginUserInfoDetailed', {
            withCredentials: true,
            responseType: "json"
        }).then(resp => {
            const respData = resp.data;
            if (respData.Status == MESSAGE_STATUS.OK) {
                setUserInfoList([respData.Attachment!]);
            }
        })
    }, []);

    return (
        <>
            <UserEditFormList data={userInfoList} ref={userEditFormListRef} />
            <Box sx={{
                display: 'flex',
                flexGrow: 1,
                justifyContent: 'center',
                padding: 1
            }} >
                <Button type="submit" variant="contained" onClick={async () => {
                    const data = userEditFormListRef.current?.getSubmitData()!;
                    if (data.length > 0) {
                        await axios.put<ApiSaveResponse>('/UserManagement/UpdateUsers', data, {
                            responseType: "json"
                        }).then(resp => {
                            const respData = resp.data;
                            if (respData.Status == MESSAGE_STATUS.OK) {
                                modalMessageRef.current?.setContentPanel(
                                    <Typography>
                                        {respData.Attachment} Users have been modified
                                    </Typography>
                                );
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
                    Save
                </Button>
            </Box>

            <CustomizedDialog
                title="Information"
                open={false}
                autoClose={1000}
                ref={modalMessageRef} />
        </>
        

    );
}

export default UserProfile;