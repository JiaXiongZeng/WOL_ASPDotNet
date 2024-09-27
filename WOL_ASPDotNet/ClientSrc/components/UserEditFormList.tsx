import {
    useState, useEffect, useContext,
    useRef, forwardRef, useImperativeHandle
} from 'react';

import {
    useForm, Controller, useFieldArray, 
    type UseFieldArrayUpdate
} from 'react-hook-form';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import EditIcon from '@mui/icons-material/Edit';


import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';
import ConfirmPasswordPanel, { ConfirmPasswordPanelHandler } from '@components/ConfirmPasswordPanel';
import { UserListHandler } from '@components/UserList';
import { AuthContext } from '@components/AuthContext';

import { UserInfoViewModel } from '@models/UserInfoViewModel';

import * as MD5 from 'ts-md5';

const fieldArrName = 'userList';

interface EditFormCardProp {
    index: number,
    value: UserInfoViewModel,
    update: UseFieldArrayUpdate<{ [fieldArrName]: UserInfoViewModel[] }>
}

const EditFormCard = (props: EditFormCardProp) => {
    const auth = useContext(AuthContext);
    const { value, index, update } = props;
    const {
        register,
        reset,
        setValue,
        control,
        watch
    } = useForm({
        defaultValues: value
    });

    const confirmModalRef = useRef<CustomizedDialogHandler>(null);
    const confirmPWDPanelRef = useRef<ConfirmPasswordPanelHandler>(null);

    const defaultPassword = "60272F3EDD3B049811C6602F663BAF44";

    useEffect(() => {
        const subscription = watch((value) => {
            update(index, value as UserInfoViewModel);
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    return (
        <>
            <CardContent sx={{
                display: "flex",
                flexDirection: "column"
            }}>
                <Typography sx={{
                    fontSize: 14,
                    backgroundColor: "#03AED2",
                    padding: "0.2em 0.2em 0.2em 0.5em",
                    borderRadius: 1
                }} color="text.secondary" gutterBottom component="div" >
                    <div style={{
                        fontWeight: "bold",
                        pointerEvents: "none",
                        display: "inline-flex",
                        marginRight: "0.5em"
                    }}>ID:</div>{`${value.LocalID}`}
                    <Tooltip arrow placement="right" title="Reset to initial one">
                        <IconButton onClick={() => {
                            reset();
                        }}>
                            <RotateLeftIcon />
                        </IconButton>
                    </Tooltip>
                </Typography>

                <TextField
                    label="User Name"
                    {...register("UserName")}
                    size="small"
                    variant="standard"
                    autoComplete="off"
                />
                <Box>
                    <TextField
                        type="password"
                        label="Password"
                        {...register("LocalPWD")}
                        size="small"
                        variant="standard"
                        autoComplete="current-password"
                        disabled={true}
                    />
                    <Tooltip arrow placement="right" title="Change password">
                        <IconButton onClick={() => {
                            confirmModalRef.current?.setOpen(true);
                        }} >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip arrow placement="right" title="Reset system default password">
                        <IconButton onClick={() => {
                            setValue("LocalPWD", "");
                            //Pretend to show the latency for changing to default password (User's perspective)
                            setTimeout(() => {
                                setValue("LocalPWD", defaultPassword);
                            }, 200);
                        }}>
                            <PsychologyAltIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <TextField
                    label="Email"
                    {...register("Email")}
                    size="small"
                    variant="standard"
                    autoComplete="off"
                />
                <TextField
                    label="Phone"
                    {...register("Phone")}
                    size="small"
                    variant="standard"
                    autoComplete="off"
                />
                {
                    auth?.IsAdmin &&
                    <>
                        <Box>
                            <InputLabel variant="standard" id={`IsAdmin.${index}-label`} >
                                Administrator
                            </InputLabel>
                            <Controller name="IsAdmin" control={control}
                                render={({ field }) => {
                                    return (
                                        <Select labelId={`IsAdmin.${index}-label`} {...field} size="small"
                                            //Currently, it hasn't supported the setValueAs property, it only supports in registered option
                                            //So that, it necessary to implment at onChange event here
                                            onChange={(e) => field.onChange(e.target.value == "true")}
                                            disabled={(value.LocalID == "admin") || (value.LocalID == auth.LocalID)}  >
                                            <MenuItem value="true">Yes</MenuItem>
                                            <MenuItem value="false">No</MenuItem>
                                        </Select>
                                    );
                                }} />
                        </Box>
                        <Box>
                            <InputLabel variant="standard" id={`Status.${index}-label`} >
                                Activiation
                            </InputLabel>
                            <Controller name="Status" control={control}
                                render={({ field }) => {
                                    return (
                                        <Select labelId={`Status.${index}-label`} {...field} size="small"
                                            disabled={(value.LocalID == "admin") || (value.LocalID == auth.LocalID)}>
                                            <MenuItem value="A">Active</MenuItem>
                                            <MenuItem value="I">Inactive</MenuItem>
                                        </Select>
                                    );
                                }}
                            />
                        </Box>
                    </>
                }
            </CardContent>
            <CustomizedDialog title="Confirm Password"
                open={false}
                showClose={true}
                actionPanel={
                    <Button onClick={() => {
                        if (confirmPWDPanelRef.current?.validate()) {
                            setValue("LocalPWD", "");
                            //Pretend to show the latency for changing to default password
                            setTimeout(() => {
                                const md5 = new MD5.Md5();
                                const confirmPWD = confirmPWDPanelRef.current?.getConfirmedPassword()!;
                                md5.appendStr(confirmPWD);
                                const hashedPWD = (md5.end() as string).toUpperCase();
                                setValue("LocalPWD", hashedPWD);
                            }, 200);

                            confirmModalRef.current?.setOpen(false);
                        }
                    }}>
                        Confirm
                    </Button>
                }
                ref={confirmModalRef}
            >
                <ConfirmPasswordPanel displayPlainText={false} ref={confirmPWDPanelRef} />
            </CustomizedDialog >
        </>        
    );
}


interface UserEditFormListProp {
    data?: UserInfoViewModel[],
    refUserList?: React.RefObject<UserListHandler>
}

export type UserEditFormListHandler = {
    getSubmitData: () => UserInfoViewModel[]
}

export const UserEditFormList =
forwardRef<UserEditFormListHandler, UserEditFormListProp>((props, ref) => {
    const { data, refUserList } = props;
    const [userList, setUserList] = useState<UserInfoViewModel[] | undefined>();

    const { control, setValue, watch } = useForm({
        defaultValues: {
            [fieldArrName]: [] as UserInfoViewModel[]
        }
    });

    const { update } = useFieldArray({
        control,
        name: fieldArrName
    });

    useEffect(() => {
        if (refUserList) {
            const users = refUserList.current?.getSelectedItems();
            setUserList(users);
            setValue(fieldArrName, users!);
        }

        if (data) {
            setUserList(data);
            setValue(fieldArrName, data!);
        }
    }, [refUserList, data]);

    useImperativeHandle(ref, () => ({
        getSubmitData: () => {
            const result = watch(fieldArrName);
            return result;
        }
    }), []);

    return (
        <>
            {
                (!userList || !userList.length) &&
                <Typography variant="h6" color="text.secondary" gutterBottom component="div" >
                    Please select at least one user~
                </Typography>
            }
            {
                userList?.map((val, idx) =>
                    <EditFormCard index={idx} value={val} update={update} key={`${fieldArrName}.${idx}`} />
                )
            }
        </>
    );
});

export default UserEditFormList;