
import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';

import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel, { FormControlLabelProps } from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';

import ToolTip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';

import { useForm, Controller } from "react-hook-form";

import axios from 'axios';

import { HostCrendentialViewModel } from '@models/HostCredentialViewModel';
import { PutHostCredentailViewModel } from '@models/PutHostCredentialViewModel';
import { HostPreferenceViewModel } from '@models/HostPreferenceViewModel';
import { PutHostPreferenceViewModel } from '@models/PutHostPreferenceViewModel';

import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';

import { NumericValue } from '@utilities/FormUtility';


export type PutHostConnectionSettings = PutHostCredentailViewModel & PutHostPreferenceViewModel;
export type HostConnectionSettingsViewModel = HostCrendentialViewModel & HostPreferenceViewModel;


export interface ConnectionSettingsPanelProp {
    data: HostConnectionSettingsViewModel
}

export type ConnectionSettingsPanelHandler = {
    getValidationResult: (e?: React.BaseSyntheticEvent<object, any, any> | undefined) => Promise<boolean>,
    getSubmitData: () => PutHostConnectionSettings
}

//Delete icon
const Delete = styled(DeleteIcon)(() => ({
    color: "#03AED2"
}));

//Customized FormControllLabel with minimal width for preetier layout
const CustFormControlLabel = (props: FormControlLabelProps) => {
    return <FormControlLabel {...props} componentsProps={{
        typography: {
            component: 'div',
            minWidth: '195px'
        }
    }} />
}

const ConnectionSettingsPanel = forwardRef<ConnectionSettingsPanelHandler, ConnectionSettingsPanelProp>((props, ref) => {
    const { data } = props;
    const [connSettings, setConnSettings] = useState(data);

    const [showDelete, setShowDelete] = useState(false);

    const refAccodionRDP = useRef<HTMLDivElement | null>(null);
    const refAccodionSSH = useRef<HTMLDivElement | null>(null);
    const refAccodionVNC = useRef<HTMLDivElement | null>(null);


    const {
        register,
        reset,
        setValue,
        control,
        handleSubmit,
        watch,
        formState: { isValid }
    } = useForm({
        defaultValues: connSettings
    });

    const submitHander = useCallback(handleSubmit((_data) => {
        //If the validator can confirm the data valid,
        //it will enter the clause
        //console.log(data);
    }), [watch]);

    useEffect(() => {
        setShowDelete((connSettings.CreateId ? true : false));
    }, [connSettings]);

    useEffect(() => {
        const { unsubscribe } = watch(_value => {
            //Console.log(value);
        })
        return () => unsubscribe();
    }, [watch]);

    useImperativeHandle(ref, () => ({
        getValidationResult: async (e) => {
            await submitHander(e);
            return isValid;
        },
        getSubmitData: () => {
            return watch() as PutHostConnectionSettings;
        }
    }), [watch, isValid]);

    const portRange = {
        min: 0,
        max: 65535
    }

    const limitPortValue = (fieldName: keyof HostConnectionSettingsViewModel, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const portNum = parseInt(e.target.value);
        if (isNaN(portNum)) {
            e.target.value = "0";
        }

        if (portNum > portRange.max) {
            e.target.value = portRange.max.toString();
        }

        if (portNum < portRange.min) {
            e.target.value = portRange.min.toString();
        }

        //Normalize numeric string
        if (e.target.value) {
            const num = parseInt(e.target.value);
            e.target.value = num.toString();
        }

        setValue(fieldName, parseInt(e.target.value));
    }

    const accodionClickEvent = (ref: React.MutableRefObject<HTMLDivElement | null>) => {
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);        
    }

    const deleteCredential = (macAddress: string) => {
        const delCredential = axios.delete<ResponseMessage<number>>("/HostCredential/Delete", {
            params: {
                macAddress: macAddress
            }
        });

        const delPreference = axios.delete<ResponseMessage<number>>("/HostPreference/Delete", {
            params: {
                macAddress: macAddress
            }
        });

        Promise.all([delCredential, delPreference])
            .then(responses => {
                const respCredential = responses[0].data;
                const respReference = responses[1].data;

                if (respCredential.Status == MESSAGE_STATUS.OK &&
                    respReference.Status == MESSAGE_STATUS.OK) {
                    const affectedRows = respCredential.Attachment! + respReference.Attachment!;
                    if (affectedRows) {
                        const emptyData = {
                            MacAddress: data.MacAddress
                        } as HostConnectionSettingsViewModel;
                        setConnSettings(emptyData);
                        reset({
                            MacAddress: data.MacAddress,
                            RDP_Domain: null,
                            RDP_Port: null,
                            RDP_UserName: null,
                            RDP_Password: null,
                            RDP_Wallpaper: null,
                            RDP_Theming: null,
                            RDP_FontSmoothing: null,
                            RDP_FullWindowDrag: null,
                            RDP_DesktopComposition: null,
                            RDP_MenuAnimations: null,
                            SSH_UserName: null,
                            SSH_Password: null,
                            SSH_Port: null,
                            VNC_UserName: null,
                            VNC_Port: null,
                            VNC_Password: null,
                            CreateId: null,
                            CreateDatetime: null,
                            UpdateId: null,
                            UpdateDatetime: null
                        });
                    }
                }
            });
    }

    return (
        <Box>
            <Box sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end"
            }}>
                <Typography variant="body1" sx={{ paddingRight: "0.5em" }}  >Mac: {connSettings.MacAddress}</Typography>
                {
                    showDelete &&
                    <IconButton
                        onClick={() => {
                            deleteCredential(connSettings.MacAddress);
                        }}>
                        <Delete />
                    </IconButton>
                }                
            </Box>
            <Accordion component="form" defaultExpanded={true}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                    ref={refAccodionRDP}
                    onClick={(_e) => {
                        accodionClickEvent(refAccodionRDP);
                    }} >
                    <Typography>Remote Desktop Protocol (RDP)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <CardContent sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>                        
                        <TextField
                            type="number"
                            label="Port"
                            {...register("RDP_Port", {
                                setValueAs: NumericValue
                            })}
                            InputProps={{
                                inputProps: {
                                    min: portRange.min,
                                    max: portRange.max
                                }
                            }}
                            InputLabelProps={{
                                shrink: true
                            }}
                            variant="standard"
                            onChange={(e) => {
                                limitPortValue("RDP_Port", e);
                            }} />
                        <TextField
                            label="Domain"
                            {...register("RDP_Domain")}
                            size="small"
                            variant="standard"
                            autoComplete="off"
                        />
                        <TextField
                            label="User Name"
                            {...register("RDP_UserName")}
                            size="small"
                            variant="standard"
                            autoComplete="off"
                        />
                        <TextField
                            type="password"
                            label="Password"
                            {...register("RDP_Password")}
                            size="small"
                            variant="standard"
                            autoComplete="current-password"
                        />
                        <FormControl component="fieldset" sx={{ mt:2 }} >
                            <FormLabel component="legend" sx={{ display: 'flex', alignItems: 'center' }} >
                                Preference
                                <ToolTip arrow placement="right" title={
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }} >Warning: </Typography>
                                        <Typography variant="caption">Enable the following parameters will downgrade the render performance!</Typography>
                                    </Box>
                                }>
                                    <WarningIcon sx={{
                                        ml: 1,
                                        '&:hover': {
                                            cursor: 'help'
                                        }
                                    }} color="warning" />
                                </ToolTip>
                            </FormLabel>
                        </FormControl>
                        <FormGroup row={true} >
                            <Controller name="RDP_Wallpaper" control={control} render={({ field }) => (
                                <CustFormControlLabel control={<Checkbox {...field} checked={field.value?? false} />} label="Wallpaper" />
                            )} />
                            <Controller name="RDP_Theming" control={control} render={({ field }) => (
                                <CustFormControlLabel control={<Checkbox {...field} checked={field.value?? false} />} label="Theming" />
                            )} />
                            <Controller name="RDP_FontSmoothing" control={control} render={({ field }) => (
                                <CustFormControlLabel control={<Checkbox {...field} checked={field.value?? false} />} label="Font Smoothing" />
                            )} />
                            <Controller name="RDP_FullWindowDrag" control={control} render={({ field }) => (
                                <CustFormControlLabel control={<Checkbox {...field} checked={field.value?? false} />} label="Full Window Drag" />
                            )} />
                            <Controller name="RDP_DesktopComposition" control={control} render={({ field }) => (
                                <CustFormControlLabel control={<Checkbox {...field} checked={field.value?? false} />} label="Desktop Composition" />
                            )} />
                            <Controller name="RDP_MenuAnimations" control={control} render={({ field }) => (
                                <CustFormControlLabel control={<Checkbox {...field} checked={field.value?? false} />} label="Menu Animations" />
                            )} />
                        </FormGroup>
                    </CardContent>
                </AccordionDetails>
            </Accordion>
            <Accordion component="form">
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                    ref={refAccodionSSH}
                    onClick={(_e) => {
                        accodionClickEvent(refAccodionSSH);
                    }} >
                    <Typography>Secure Shell (SSH)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <CardContent sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <TextField
                            type="number"
                            label="Port"
                            {...register("SSH_Port", {
                                setValueAs: NumericValue
                            })}
                            InputProps={{
                                inputProps: {
                                    min: portRange.min,
                                    max: portRange.max
                                }
                            }}
                            InputLabelProps={{
                                shrink: true
                            }}
                            variant="standard"
                            onChange={(e) => {
                                limitPortValue("SSH_Port", e);
                            }} />
                        <TextField
                            label="User Name"
                            {...register("SSH_UserName")}
                            size="small"
                            variant="standard"
                            autoComplete="off"
                        />
                        <TextField
                            type="password"
                            label="Password"
                            {...register("SSH_Password")}
                            size="small"
                            variant="standard"
                            autoComplete="current-password"
                        />
                    </CardContent>
                </AccordionDetails>
            </Accordion>
            <Accordion component="form">
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                    ref={refAccodionVNC}
                    onClick={(_e) => {
                        accodionClickEvent(refAccodionVNC);
                    }} >
                    <Typography>Virtual Network Computing (VNC)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <CardContent sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <TextField
                            type="number"
                            label="Port"
                            {...register("VNC_Port", {
                                setValueAs: NumericValue
                            })}
                            InputProps={{
                                inputProps: {
                                    min: portRange.min,
                                    max: portRange.max
                                }
                            }}
                            InputLabelProps={{
                                shrink: true
                            }}
                            variant="standard"
                            onChange={(e) => {
                                limitPortValue("VNC_Port", e);
                            }} />
                        <TextField
                            label="User Name"
                            {...register("VNC_UserName")}
                            size="small"
                            variant="standard"
                            autoComplete="off"
                        />
                        <TextField
                            type="password"
                            label="Password"
                            {...register("VNC_Password")}
                            size="small"
                            variant="standard"
                            autoComplete="current-password"
                        />
                    </CardContent>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
});

export default ConnectionSettingsPanel;