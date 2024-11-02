import {
    useEffect, useState, useRef, useCallback, useContext,
    forwardRef, useImperativeHandle,
    ReactNode
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useImmer } from 'use-immer';
import { type HostViewModel } from 'models/HostViewModel';

import axios from 'axios';

import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import MuiTableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';

import IconButton from '@mui/material/IconButton';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import ConnectedTvIcon from '@mui/icons-material/ConnectedTv';
import TerminalIcon from '@mui/icons-material/Terminal';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import SpeedIcon from '@mui/icons-material/Speed';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SaveIcon from '@mui/icons-material/Save';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';

import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';
import UtilityPanel, { UtilityPanelHandler } from '@components/UtilityPanel';
import { TableHead, TableRow } from '@utilities/styles/CustomizedTableStyle';

import { ConfigContext } from '@components/ConfigContext';

import ConnectionSettingsPanel, { ConnectionSettingsPanelHandler } from '@components/ConnectionSettingsPanel';
import { HostCrendentialViewModel } from '@models/HostCredentialViewModel';

//import { submitForm } from '@utilities/FormUtility';

import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';
import { ICMPEchoInfo } from '@models/ICMPEchoInfo';

import * as lodash from 'lodash';

//Power on icon
const PowerOn = styled(DeviceHubIcon)(() => ({
    color: "#03AED2"
}));

//RDP icon
const RDP = styled(ConnectedTvIcon)(() => ({
    color: "#03AED2"
}));

//SSH icon
const SSH = styled(TerminalIcon)(() => ({
    color: "#03AED2"
}));


//VNC icon
const VNC = styled(VisibilityIcon)(() => ({
    color: "#03AED2"
}));

const ConnActions = [
    { type: "RDP", icon: <RDP />, name: 'Remote Desktop Protocol (RDP)' },
    { type: "SSH", icon: <SSH />, name: 'Secure Shell (SSH)' },
    { type: "VNC", icon: <VNC />, name: 'Virtual Network Computing (VNC)' }
];

//Power off icon
const PowerOff = styled(PowerOffIcon)(() => ({
    color: "#03AED2"
}));

//Settings icon
const Settings = styled(SettingsIcon)(() => ({
    color: "#03AED2"
}));

//test icon
const Test = styled(SpeedIcon)(() => ({
    color: "#03AED2"
}));

export interface HostListProp {
    selectable?: boolean,
    showAction?: boolean
}


export type HostListHandler = {
    reload: () => void,
    getSelectedItems: () => HostViewModel[],
    resetSelectedIds: () => void
}

const HostList = forwardRef<HostListHandler, HostListProp>((props, ref) => {
    const [hostList, setHostList] = useImmer<Nullable<HostViewModel[]>>(null);
    const modalRef = useRef<CustomizedDialogHandler>(null);
    const modalConnSettingsRef = useRef<CustomizedDialogHandler>(null);
    const modalInfoRef = useRef<CustomizedDialogHandler>(null);
    const selectedItemsRef = useRef<HostViewModel[]>([]);
    const { selectable, showAction } = props;

    const configs = useContext(ConfigContext);

    const [tryToPing, setTryToPing] = useState<boolean>(false);

    const utilityRef = useRef<UtilityPanelHandler>(null);
    const [isPingStart, setIsPingStart] = useState<boolean>(false);

    const connSettingsRef = useRef<ConnectionSettingsPanelHandler>(null);

    const navigate = useNavigate();

    const navigateTo = (route: string, state?: any) => {
        navigate(route, { replace: true, state: state });
    }

    /************************** Selection Feature Begin **************************/
    const [rowCount, setRowCount] = useState(0);
    const [selectedIDs, setSelectedIDs] = useState<readonly string[]>([]);

    const onSelectAllClick = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelected = hostList!.map((n) => n.MacAddress);
            setSelectedIDs(newSelected);
            return;
        }
        setSelectedIDs([]);
    }, [hostList]);

    const handleClick = (_event: React.MouseEvent<unknown>, macAddress: string) => {
        const selectedIndex = selectedIDs.indexOf(macAddress);
        let newSelected: readonly string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedIDs, macAddress);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedIDs.slice(1));
        } else if (selectedIndex === selectedIDs.length - 1) {
            newSelected = newSelected.concat(selectedIDs.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedIDs.slice(0, selectedIndex),
                selectedIDs.slice(selectedIndex + 1),
            );
        }
        setSelectedIDs(newSelected);
    };

    const isSelected = (id: string) => selectedIDs.indexOf(id) !== -1;
    /************************** Selection Feature End **************************/

    const getHostList = async () => {
        await axios.get<Nullable<HostViewModel[]>>('/Host/GetPowerOnHostList', {
            responseType: "json"
        }).then(response => {
            setHostList(response.data);
            setRowCount(response.data!.length || 0);
            setTryToPing(true);
        });
    };

    useEffect(() => {        
        getHostList();
    }, []);

    useEffect(() => {
        const items = lodash.cloneDeep(hostList)!;
        const selectedItems = lodash.filter(items, x => selectedIDs.indexOf(x.MacAddress) !== -1);
        selectedItemsRef.current = selectedItems;
    }, [hostList, selectedIDs]);

    useEffect(() => {
        if (showAction && tryToPing) {
            lodash.forEach(hostList, async (host) => {
                //Intend to randomly delay some time to avoid the too dense requests resulting in breaking the packet captures
                lodash.delay(async () => {
                    await axios.get<ResponseMessage<ICMPEchoInfo>>('Host/PingInternal', {
                        responseType: "json",
                        params: {
                            IPv4: host.IPv4,
                            Mac: host.MacAddress
                        }
                    }).then(response => {
                        const respData = response.data;
                        if (respData.Status == MESSAGE_STATUS.OK) {
                            if (respData.Attachment && !respData.Attachment.IsTimeout) {
                                const idxOfHost = lodash.findIndex(hostList, x => x.MacAddress == host.MacAddress);
                                if (idxOfHost != -1) {
                                    setHostList(draft => {
                                        draft![idxOfHost].PowerOn = true;
                                    });
                                }
                            }
                        }
                    });
                }, Math.floor(lodash.random(1, hostList?.length!, true)) * 50, [host]);                                      
            });
        }
    }, [tryToPing]);

    const PingActionPanel = useCallback(() => {
        return (
            <Button onClick={() => {
                setIsPingStart(!isPingStart);
            }}>
                {isPingStart
                    ?
                        <>
                            <StopIcon />
                            <Typography>
                                Stop
                            </Typography>
                        </>
                    :
                        <>
                            <PlayArrowIcon />
                            <Typography>
                                Ping
                            </Typography>
                        </>
                }
            </Button>
        ); 
    }, [isPingStart]);

    useEffect(() => {
        if (isPingStart) {
            utilityRef.current?.startPing();
        } else {
            utilityRef.current?.stopPing();
        }

        modalRef.current?.setActionPanel(
            <PingActionPanel/>
        );
    }, [isPingStart]);

    const loadConnSettings = async (macAddress: string) => {
        await axios.get<ResponseMessage<HostCrendentialViewModel>>("/HostCredential/Get", {
            params: {
                macAddress: macAddress
            }
        }).then(resp => {
            const respData = resp.data;
            let contentNode: ReactNode = null;
            let contentData: Nullable<HostCrendentialViewModel> = null;
            if (respData.Status == MESSAGE_STATUS.OK) {
                if (respData.Attachment) {
                    contentData = { ...respData.Attachment };
                    contentNode = <ConnectionSettingsPanel data={contentData} ref={connSettingsRef} />;
                } else {
                    contentData = {
                        MacAddress: macAddress
                    } as HostCrendentialViewModel;
                    contentNode = <ConnectionSettingsPanel data={contentData} ref={connSettingsRef} />;
                }

                modalConnSettingsRef.current?.setContentPanel(contentNode);
                modalConnSettingsRef.current?.setOpen(true);
            }
        });
    };

    useImperativeHandle(ref, () => {
        return {
            reload: getHostList,
            getSelectedItems: () => {
                return selectedItemsRef.current;
            },
            resetSelectedIds: () => {
                setSelectedIDs([]);
                selectedItemsRef.current = [];
            }
        };
    }, []);

    return (
        <>
            <TableContainer component={Paper}>
                <Table sx={{
                    minWidth: 650,
                    '& .MuiTableCell-root': {
                        padding: '3px 8px'
                    }
                }} size="medium">
                    <TableHead>
                        <MuiTableRow>
                            {
                                selectable &&
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        color="primary"
                                        indeterminate={selectedIDs.length > 0 && selectedIDs.length < rowCount}
                                        checked={rowCount > 0 && selectedIDs.length === rowCount}
                                        onChange={onSelectAllClick}
                                        inputProps={{
                                            'aria-label': 'select all desserts',
                                        }}
                                    />
                                </TableCell>
                            }                            
                            <TableCell align="center">HostName</TableCell>
                            <TableCell align="center" sx={{ minWidth: "210px" }} >Domain</TableCell>
                            <TableCell align="center" sx={{ minWidth: "110px" }} >IPv4</TableCell>
                            {/*<TableCell align="center">IPv6</TableCell>*/}
                            <TableCell align="center" sx={{ minWidth: "160px" }} >MacAddress</TableCell>
                            <TableCell align="center" sx={{ minWidth: "80px" }}>Port</TableCell>
                            {
                                showAction &&
                                <TableCell align="center">Action</TableCell>
                            }                            
                        </MuiTableRow>
                    </TableHead>
                    <TableBody>
                        {hostList && hostList.map((row, index) => {
                            const isItemSelected = isSelected(row.MacAddress);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    key={row.MacAddress}
                                    sx=
                                    {
                                        {
                                            cursor: 'pointer'
                                        }
                                    }
                                    hover={true}
                                    onClick={selectable? (event) => handleClick(event, row.MacAddress): undefined}
                                >
                                    {
                                        selectable &&
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                color="primary"
                                                checked={isItemSelected}
                                                inputProps={{
                                                    'aria-labelledby': labelId,
                                                }}
                                            />
                                        </TableCell>
                                    }                                    
                                    <TableCell align="center" component="th" scope="row">
                                        {row.HostName}
                                    </TableCell>
                                    <TableCell align="center">{row.Domain}</TableCell>
                                    <TableCell align="center">{row.IPv4}</TableCell>
                                    {/*<TableCell align="center">{row.IPv6}</TableCell>*/}
                                    <TableCell align="center">{row.MacAddress}</TableCell>
                                    <TableCell align="center">{row.WOL_Port}</TableCell>
                                    {
                                        showAction &&
                                        <TableCell align="center">
                                            <Box sx={{ display: "inline-flex", flexWrap: "wrap" }}>
                                                {
                                                    (
                                                        row.PowerOn
                                                            ?
                                                            <SpeedDial key={`SpeedDial_${row.MacAddress}`}
                                                                    role="button"
                                                                    ariaLabel={`Host ${row.HostName ?? row.IPv4} connect method`}
                                                                    icon={<SpeedDialIcon icon={<PowerOn />} />}
                                                                    direction="left"
                                                                    sx={{
                                                                        '& .MuiSpeedDial-actions': { position: "absolute", margin: "unset", padding: "unset" },
                                                                        '& .MuiFab-root': {
                                                                            boxShadow: 'none' // Disable shadow
                                                                        },
                                                                        '& .MuiSpeedDial-fab:hover': {
                                                                            backgroundColor: 'rgba(216,216,216,0.4)'
                                                                        },
                                                                    }}
                                                                    FabProps={{
                                                                        size: "small",
                                                                        disableRipple: true,
                                                                        sx: {
                                                                            margin: "0",
                                                                            width: "unset",
                                                                            height: "unset",
                                                                            padding: "8px",
                                                                            backgroundColor: 'transparent'
                                                                        }
                                                                    }}>
                                                                    {
                                                                        ConnActions.map((action) =>
                                                                            <SpeedDialAction key={`SpeedDial_${row.MacAddress}_${action.name}`}
                                                                                role="button"
                                                                                icon={action.icon}
                                                                                tooltipTitle={action.name}
                                                                                sx={{ pdding: "0px", margin: "0px", marginRight: "4px"/*, marginTop: "4px"*/ }}
                                                                                onClick={() => {
                                                                                    //Get connection settings from DB
                                                                                    axios.get<ResponseMessage<any>>(`/HostCredential/Get${action.type}`, {
                                                                                        params: {
                                                                                            macAddress: row.MacAddress
                                                                                        }
                                                                                    }).then(resp => {
                                                                                        const respData = resp.data;
                                                                                        if (respData.Status == MESSAGE_STATUS.OK) {
                                                                                            navigateTo("/RemoteGateway", {
                                                                                                Type: action.type,
                                                                                                Ip: row.IPv4,
                                                                                                GuacamoleSharpWebSocket: configs?.GuacamoleSharpWebSocket,
                                                                                                GuacamoleSharpTokenURL: configs?.GuacamoleSharpTokenURL,
                                                                                                GuacamoleSharpTokenPhrase: configs?.GuacamoleSharpTokenPhrase,
                                                                                                ...respData.Attachment
                                                                                            });
                                                                                        }
                                                                                    });                                                                       
                                                                                }} />
                                                                        )
                                                                    }
                                                            </SpeedDial>                                                           
                                                            :
                                                            <Tooltip arrow title="Turn on PC" onClick={async() => {
                                                                    const data = {
                                                                        macAddress: row.MacAddress,
                                                                        port: row.WOL_Port
                                                                    };
                                                                    await axios.post<ResponseMessage<void>>("/Host/WakeOnLan", data, {
                                                                        responseType: "json"
                                                                    }).then(resp => {
                                                                        const respData = resp.data;
                                                                        if (respData.Status == MESSAGE_STATUS.OK) {
                                                                            modalInfoRef.current?.setContentPanel(
                                                                                <Typography>
                                                                                    {`Magic Packet has sent to ${row.MacAddress}`}
                                                                                </Typography>
                                                                            );
                                                                            modalInfoRef.current?.setOpen(true);
                                                                        }
                                                                    });
                                                                }}>
                                                                    <IconButton>
                                                                        <PowerOff />
                                                                    </IconButton>
                                                            </Tooltip>                                                        
                                                    )
                                                }
                                            
                                                <Tooltip arrow title="Config the RDP settings">
                                                        <IconButton onClick={async () => {
                                                            await loadConnSettings(row.MacAddress);                                                      
                                                        }}>
                                                            <Settings />
                                                        </IconButton>
                                                </Tooltip>
                                                <Tooltip arrow title="Test utility">
                                                        <IconButton onClick={() => {
                                                            modalRef.current?.setOpen(true);
                                                            modalRef.current?.setContentPanel
                                                            (
                                                                <Box>
                                                                    <UtilityPanel data={row} ref={utilityRef} />
                                                                </Box>
                                                            )
                                                        }}>
                                                            <Test />
                                                        </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    }                                    
                                </TableRow>
                            );
                        })}
                        {
                            (!hostList || !hostList.length) && 
                            <TableRow hover={true}>
                                    <TableCell colSpan={7}>
                                        <Typography align="center">
                                            No host listed
                                        </Typography>
                                    </TableCell>
                            </TableRow>
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            <CustomizedDialog
                title="Test Host Connection"
                open={false}
                showClose={true}
                onClose={() => {
                    setIsPingStart(false);
                }}
                actionPanel={<PingActionPanel/>}
                ref={modalRef}  >
            </CustomizedDialog>
            <CustomizedDialog
                title="Connection Settings"
                open={false}
                showClose={true}
                minHeight="60vh"
                fullWidth={true}
                actionPanel={
                    <>
                        <Button
                            onClick={() => {
                                const isValid = connSettingsRef.current?.getValidationResult();
                                if (isValid) {
                                    const submitData = connSettingsRef.current?.getSubmitData();

                                    axios.put<ResponseMessage<number>>("/HostCredential/Update", submitData, {
                                        responseType: "json"
                                    }).then(async (resp) => {
                                        const respData = resp.data;
                                        if (respData.Status == MESSAGE_STATUS.OK) {
                                            modalInfoRef.current?.setContentPanel(
                                                <Typography>
                                                    {`${respData.Attachment} connection setting has been altered!`}
                                                </Typography>
                                            );
                                            await loadConnSettings(submitData?.MacAddress!);
                                        } else {
                                            modalInfoRef.current?.setContentPanel(
                                                <Typography>
                                                    {respData.Message}
                                                </Typography>
                                            );
                                        }

                                        modalInfoRef.current?.setOpen(true);
                                    });
                                }
                            }}>
                            <SaveIcon />
                            <Typography>
                                Save
                            </Typography>
                        </Button>
                    </>
                }
                ref={modalConnSettingsRef}  >                
            </CustomizedDialog>
            <CustomizedDialog
                title="Infomation"
                open={false}
                showClose={false}
                autoClose={1000}
                ref={modalInfoRef} >
            </CustomizedDialog>
        </>
    );
});

export default HostList;