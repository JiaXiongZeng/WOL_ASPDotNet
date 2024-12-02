import { useEffect, useState, useRef, useContext } from 'react';
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import axios from 'axios';

import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import MuiTableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import Button from '@mui/material/Button';

import { TableHead, TableRow } from '@utilities/styles/CustomizedTableStyle';
import { type DeviceInfo } from '@models/DeviceInfoViewModel';

import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';
import { ResponseMessage, MESSAGE_STATUS } from '@models/ResponseMessage';
import { Configurations } from '@models/Configurations';
import { ConfigDispatchContext, ConfigActionKind } from '@components/ConfigContext';

import { /*defaultNull,*/ removeEmptyFields } from '@utilities/FormUtility';

export const ConfigTable = () => {
    const configDispatch = useContext(ConfigDispatchContext);

    const [deviceList, setDeviceList] = useState<Nullable<DeviceInfo[]>>(null);

    const modalRef = useRef<CustomizedDialogHandler>(null);

    const submitRef = useRef<HTMLButtonElement>(null);

    const getConfigs = async () => {
        return await axios.get<ResponseMessage<Configurations>>('/Config/Get', {
            responseType: "json"
        }).then(response => {
            const respData = response.data;
            if (respData.Attachment) {
                reset(response.data.Attachment);

                //Reset the global configuration used by whole APP scope
                configDispatch!({
                    actionKind: ConfigActionKind.SET,
                    args: [respData.Attachment]
                });
            }
        });
    };

    useEffect(() => {
        const getDeviceList = async () => {
            return await axios.get<Nullable<DeviceInfo[]>>('/Host/GetDeviceList', {
                responseType: "json"
            }).then(response => {
                const respData = response.data;
                if (respData) {
                    setDeviceList(respData);
                }
            });
        };

        getDeviceList().then(getConfigs);       
    }, []);

    const {
        register,
        reset,
        control,
        handleSubmit,
        //watch,
        formState: { errors }
    } = useForm<Configurations>({
        defaultValues: {
            NetworkDevice: "Default",
            CacheExpirationTimespan: 30,
            CacheDumpTimespan: 1,
            GuacamoleSharpWebSocket: '',
            GuacamoleSharpTokenURL: '',
            GuacamoleSharpTokenPhrase: ''
        }
    });

    const onSubmit: SubmitHandler<Configurations> =
        async (data) => {
            //Delete empty fields
            removeEmptyFields(data);

            toggleElement(submitRef.current!);
            await axios.post<Nullable<ResponseMessage<any>>>('/Config/Save', data, {
                responseType: "json",
            }).then(async response => {
                const respData = response.data;

                if (respData?.Status == MESSAGE_STATUS.OK) {
                    modalRef.current?.setContentPanel(
                        <>
                            <Typography variant="h6" gutterBottom>
                                { respData?.Message }
                            </Typography>
                        </>
                    );
                    modalRef.current?.setOpen(true);
                }

                await getConfigs();
            });
        };

    //console.log(watch("NetworkDevice"));

    const toggleElement = (ele: Partial<HTMLInputElement>) => {
        ele.disabled = !ele.disabled;
    }

    return (
        <>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, paddingBottom:1, textAlign: "center" }} >
                System Settings
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} size="small">
                        <TableHead>
                            <MuiTableRow>
                                <TableCell align="center" width="40%" >Variable</TableCell>
                                <TableCell align="center" width="60%" >Value</TableCell>
                            </MuiTableRow>
                        </TableHead>
                        <TableBody sx={{
                            "& td.MuiTableCell-root": {
                                width: "100%"
                            },
                            "& td .MuiFormControl-root": {
                                width: "inherit"
                            },
                            "& td .MuiInputBase-root:not(.MuiOutlinedInput-root)": {
                                width: "100%"
                            }
                        }}>
                            <TableRow hover={true}>
                                <TableCell align="center" component="th" scope="row">
                                    Network Device
                                    {errors.NetworkDevice && <div>Must specify device.</div>}
                                </TableCell>
                                <TableCell align="left">
                                    <Controller name="NetworkDevice" control={control}
                                        render={({ field }) => {
                                            return (
                                                <Select {...field} size="small" >
                                                    <MenuItem key="NetworkDevice_Default" value="Default">
                                                        <em>Default</em>
                                                    </MenuItem>
                                                    {deviceList && deviceList.map((device) => {
                                                        return (
                                                            <MenuItem key={`NetworkDevice_${device.ID}`} value={device.ID}>{device.FriendlyName ?? device.Name}</MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            );
                                        }} />
                                </TableCell>
                            </TableRow>
                            <TableRow hover={true}>
                                <TableCell align="center" component="th" scope="row">
                                    Cache Expiration Timespan (minutes)
                                </TableCell>
                                <TableCell align="left">
                                    <TextField
                                        type="number"
                                        inputProps={
                                            { min: 1 }
                                        }
                                        variant="standard"
                                        {...register("CacheExpirationTimespan", { /*setValueAs: defaultNull*/ })}
                                        placeholder="60"
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow hover={true}>
                                <TableCell align="center" component="th" scope="row">
                                    Cache Dump Timespan (minutes)
                                </TableCell>
                                <TableCell align="left">
                                    <TextField
                                        type="number"
                                        inputProps={
                                            { min: 1 }
                                        }
                                        variant="standard"
                                        {...register("CacheDumpTimespan", { /*setValueAs: defaultNull*/ })}
                                        placeholder="1"
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow hover={true}>
                                <TableCell align="center" component="th" scope="row">
                                    Guacamole-Sharp Web Socket URL
                                </TableCell>
                                <TableCell align="left">
                                    <TextField
                                        variant="standard"
                                        {...register("GuacamoleSharpWebSocket", { /*setValueAs: defaultNull*/ })}
                                        placeholder="ws://localhost:8088/connect"
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow hover={true}>
                                <TableCell align="center" component="th" scope="row">
                                    Guacamole-Sharp Token URL
                                </TableCell>
                                <TableCell align="left">
                                    <TextField
                                        variant="standard"
                                        {...register("GuacamoleSharpTokenURL", { /*setValueAs: defaultNull*/ })}
                                        placeholder="http://localhost:8088/token"
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow hover={true}>
                                <TableCell align="center" component="th" scope="row">
                                    Guacamole-Sharp Token Phrase
                                </TableCell>
                                <TableCell align="left">
                                    <TextField
                                        variant="standard"
                                        {...register("GuacamoleSharpTokenPhrase", { /*setValueAs: defaultNull*/ })}
                                        placeholder="aA1234567"
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{
                    display: 'flex',
                    flexGrow: 1,
                    justifyContent: 'center',
                    padding: 1
                }} >
                    <Button type="submit" variant="contained" ref={submitRef} >
                        Save
                    </Button>
                </Box>
            </form>
            <CustomizedDialog
                title="Information"
                open={false}
                autoClose={1000}
                onClose={
                    () => {
                        toggleElement(submitRef.current!);
                    }
                }
                ref={modalRef} >
            </CustomizedDialog>
        </> 
    );
}

export default ConfigTable;