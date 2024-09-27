import { useRef } from 'react';

import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';

import axios from 'axios';
import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';
import { type HostDetectViewModel } from '@models/HostDetectViewModel';

import ArpEchoHosts, { ArpEchoHostsHandler } from '@components/ArpEchoHosts';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import Tooltip from '@mui/material/Tooltip';
import LanIcon from '@mui/icons-material/Lan';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';
import HostList, { HostListHandler } from '@components/HostList';
import HostEditFormList, { HostEditFormListHandler } from '@components/HostEditFormList';

import * as lodash from 'lodash';


const queryClient = new QueryClient();
export const MaintainHosts = () => {
    const modalHostListRef = useRef<CustomizedDialogHandler>(null);
    const modalMessageRef = useRef<CustomizedDialogHandler>(null);
    const modalModificationRef = useRef<CustomizedDialogHandler>(null);
    const modalDeleteRef = useRef<CustomizedDialogHandler>(null);

    const arpEchHostRef = useRef<ArpEchoHostsHandler>(null);
    const hostListRef = useRef<HostListHandler>(null);
    const editFormListRef = useRef<HostEditFormListHandler>(null);


    const addToMyHostList = async (data: HostDetectViewModel[]) => {
        axios.post<Nullable<ResponseMessage<any>>>("/Host/AddToMyHostList", data, {
            responseType: "json"
        }).then(response => {
            const respData = response.data;
            if (respData?.Status == MESSAGE_STATUS.OK) {
                modalMessageRef.current?.setContentPanel(
                    <>
                        <Typography variant="h6" gutterBottom>
                            {respData?.Message}
                        </Typography>
                    </>
                );
                modalMessageRef.current?.setOpen(true);
                hostListRef.current?.reload();
            }
        }).catch(response => {
            const respData = response.data;
            if (respData) {
                modalMessageRef.current?.setContentPanel(
                    <>
                        <Typography variant="h6" gutterBottom
                            sx={{
                                color: "red"
                            }}
                        >
                            {respData?.Message}
                        </Typography>
                    </>
                );
                modalMessageRef.current?.setOpen(true);
            }
        })
    };

    return (
        <>
            <Box>
                <Typography variant="h6" align="center">
                    Maintain Hosts
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}>
                <Tooltip arrow title="Show hosts in the intranet">
                    <IconButton onClick={() => {
                        modalHostListRef.current?.setOpen(true);
                    }}>
                        <LanIcon sx={{ color: "#03AED2" }} />
                    </IconButton>
                </Tooltip>
                <Tooltip arrow title="Modify the information of hosts">
                    <IconButton onClick={(_e) => { 
                        modalModificationRef.current?.setOpen(true);
                    }}>
                        <EditIcon sx={{ color: "#03AED2" }} />
                    </IconButton>
                </Tooltip>
                <Tooltip arrow title="Delete selected hosts">
                    <IconButton onClick={(_e) => {                        
                        const selectedList = hostListRef.current?.getSelectedItems()!;

                        if (selectedList.length > 0) {
                            const macList = lodash.map(selectedList, x => x.MacAddress);
                            modalDeleteRef.current?.setContentPanel(
                                <Typography component="div" >
                                    Are you sure you want to delete the following items?
                                    {
                                        macList.length > 0 &&
                                        <ul key={`ul.deleteHint`} style={{ marginTop: 0, marginBottom: 0 }}>
                                            {macList.map(x => <li key={`li.deleteHint.${x}`} >{x}</li>)}
                                        </ul>
                                    }
                                </Typography>
                            );
                            modalDeleteRef.current?.setOpen(true);
                        } else {
                            modalMessageRef.current?.setContentPanel(
                                <Typography>
                                    Please select at least one host~
                                </Typography>
                            );
                            modalMessageRef.current?.setOpen(true);
                        }
                    }} >
                        <DeleteForeverIcon sx={{ color: "#03AED2" }} />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <HostList selectable={true} ref={hostListRef} />
            </Box>

            <CustomizedDialog
                title="Available Hosts"
                open={false}
                showClose={true}
                fullWidth={true}
                maxWidth="xl"
                minHeight="90vh"
                actionPanel={
                    <>
                        <Button onClick={async () =>
                        {
                            modalHostListRef.current?.setOpen(false);
                            const selectedRows = arpEchHostRef.current?.getSelectedRows();
                            //console.log(JSON.stringify(selectedRows));

                            if (selectedRows && selectedRows.length > 0) {
                                await addToMyHostList(selectedRows);
                            } else {
                                modalMessageRef.current?.setContentPanel(
                                    <>
                                        <Typography variant="h6" gutterBottom
                                            sx={{
                                                color: "red"
                                            }}
                                        >
                                            Please select at least one record!
                                        </Typography>
                                    </>
                                );
                                modalMessageRef.current?.setOpen(true);
                            }
                        }}>
                            <AddIcon />
                            <Typography sx={{ marginLeft: 1, marginBottom: 0 }} >
                                Add to Host List
                            </Typography>
                        </Button>
                    </>
                }
                ref={modalHostListRef}  >
                <QueryClientProvider client={queryClient}>
                    <ArpEchoHosts ref={arpEchHostRef} />
                </QueryClientProvider>
            </CustomizedDialog>

            <CustomizedDialog
                title="List of Host Modification"
                open={false}
                showClose={true}
                fullWidth={true}
                maxWidth="xl"
                minHeight="90vh"
                actionPanel={
                    <>
                        <Button onClick={() => {
                            const data = editFormListRef.current?.getSubmitData()!;
                            if (data.length > 0) {
                                axios.post<ResponseMessage<any>>('/Host/UpdateMyHostList', data, {
                                    responseType: "json"
                                }).then(resp => {
                                    const respData = resp.data;
                                    if (respData.Status == MESSAGE_STATUS.OK) {
                                        modalModificationRef.current?.setOpen(false);
                                        hostListRef.current?.reload();
                                        modalMessageRef.current?.setContentPanel(
                                            <Typography>
                                                { respData.Message }
                                            </Typography>
                                        );
                                        modalMessageRef.current?.setOpen(true);
                                    }
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
                ref={modalModificationRef} >
                <HostEditFormList refHostList={hostListRef} ref={editFormListRef} />
            </CustomizedDialog>

            <CustomizedDialog
                title="Warning"
                open={false}
                actionPanel={
                    <>
                        <Button onClick={(_e) => {
                            const data = hostListRef.current?.getSelectedItems()!;
                            if (data.length > 0) {
                                axios.post<ResponseMessage<any>>('/Host/DeleteMyHostList', data, {
                                    responseType: "json"
                                }).then(resp => {
                                    const respData = resp.data;
                                    if (respData.Status == MESSAGE_STATUS.OK) {
                                        modalModificationRef.current?.setOpen(false);
                                        hostListRef.current?.reload();
                                        hostListRef.current?.resetSelectedIds();
                                        modalMessageRef.current?.setContentPanel(
                                            <Typography>
                                                {respData.Message}
                                            </Typography>
                                        );
                                        modalDeleteRef.current?.setOpen(false);
                                        modalMessageRef.current?.setOpen(true);
                                    }
                                });
                            }
                        }}>
                            <Typography>
                                Confirm
                            </Typography>
                        </Button>
                        <Button onClick={(_e) => {
                            modalDeleteRef.current?.setOpen(false);
                        }}>
                            <Typography>
                                Cancel
                            </Typography>
                        </Button>
                    </>
                }
                ref={modalDeleteRef} />

            <CustomizedDialog
                title="Information"
                open={false}
                autoClose={1000}
                ref={modalMessageRef} />
        </>
    );    
}

export default MaintainHosts;