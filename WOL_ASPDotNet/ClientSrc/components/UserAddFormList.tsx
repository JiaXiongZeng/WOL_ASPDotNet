import React, { useCallback, forwardRef, useImperativeHandle } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { ErrorMessage } from '@hookform/error-message';
import { UserInfoViewModel } from '@models/UserInfoViewModel';

import * as lodash from 'lodash';

const fieldArrName = 'userList';

interface UserAddFormListProps {
    withDefaultPassword?: boolean
};

export type UserAddFormListHandler = {
    addNewUser: () => void,
    /**
     * This handler was provided by react-hook-form mechanism, which will valide the form automatically
     * @param e Event object
     * @returns validation result
     */
    getValidationResult: (e?: React.BaseSyntheticEvent<object, any, any> | undefined) => Promise<boolean>,//(e?: React.BaseSyntheticEvent<object, any, any> | undefined) => Promise<void>, //SubmitHandler<{[fieldArrName]:UserInfoViewModel}>,
    getSubmitData: () => UserInfoViewModel[]
};

const UserAddFormList = forwardRef<UserAddFormListHandler, UserAddFormListProps>((props, ref) => {
    const { withDefaultPassword = true } = props;
    const defaultPassword = "60272F3EDD3B049811C6602F663BAF44";

    const addTemplate: UserInfoViewModel = {
        LocalID: "",
        OAuthID: null,
        UserName: "",
        Email: null,
        Phone: null,
        LocalPWD: (withDefaultPassword ? defaultPassword : ""),
        IsAdmin: false,
        Status: 'A'
    };

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors, isValid } 
    } = useForm({
        defaultValues: {            
            [fieldArrName]: [lodash.clone(addTemplate)] as UserInfoViewModel[]
        }
    });

    const {
        fields, append, insert, remove
    } = useFieldArray({
        name: fieldArrName,
        control
    });

    const submitHander = useCallback(handleSubmit((_data) => {
        //If the validator can confirm the data valid,
        //it will enter the clause
        //console.log(data);
    }), [watch]);

    useImperativeHandle(ref, () => ({
        getSubmitData: () => {
            const result = watch(fieldArrName);
            return result;
        },
        getValidationResult: async (e) => {
            await submitHander(e);
            return isValid;
        },
        addNewUser: () => {
            append(lodash.clone(addTemplate));
        }
    }), [watch, isValid]);


    return (
        <>
            {
                fields.map((_item, index) => {
                    return (
                        <CardContent
                            key={`addUser.${index}`}
                            sx={{
                                display: "flex",
                                flexDirection: "column"
                            }}
                        >
                            <Typography sx={{
                                fontSize: 14,
                                backgroundColor: "#03AED2",
                                padding: "0.2em 0.2em 0.2em 0.5em",
                                borderRadius: 1
                            }} color="text.secondary" gutterBottom component="div" >
                                <Tooltip arrow placement="top-end" title="Add next one">
                                    <IconButton onClick={() => {
                                        insert(index + 1, lodash.clone(addTemplate));
                                    }}>
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                                {
                                    index == 0
                                    ?
                                    <></>
                                    :
                                    <Tooltip arrow placement="top-end" title="Remove this user">
                                        <IconButton onClick={() => {
                                            remove(index);
                                        }}>
                                            <RemoveIcon />
                                        </IconButton>
                                    </Tooltip>
                                }                                
                            </Typography>

                            <Stack gap={1}>
                                <TextField
                                    label="User ID"
                                    {...register(`${fieldArrName}.${index}.LocalID`, { required: "User ID is required" })}
                                    size="small"
                                    variant="standard"
                                    autoComplete="off"
                                />
                                <ErrorMessage
                                    errors={errors}
                                    name={`${fieldArrName}.${index}.LocalID`}
                                    render={
                                        ({ message }) =>
                                            <Typography color={(theme) => {
                                                return theme.palette.error.main;
                                            }}>
                                                * {message}
                                            </Typography>
                                    }
                                />
                            </Stack>

                            <Stack>
                                <TextField
                                    label="User Name"
                                    {...register(`${fieldArrName}.${index}.UserName`, { required: "User Name is requried" })}
                                    size="small"
                                    variant="standard"
                                    autoComplete="off"
                                />
                                <ErrorMessage
                                    errors={errors}
                                    name={`${fieldArrName}.${index}.UserName`}
                                    render={
                                        ({ message }) =>
                                            <Typography color={(theme) => {
                                                return theme.palette.error.main;
                                            }}>
                                                * {message}
                                            </Typography>
                                    }
                                />
                            </Stack>

                            <Stack>
                                <TextField
                                    type="password"
                                    label="Password"
                                    {...register(`${fieldArrName}.${index}.LocalPWD`, { required: "Password is required" })}
                                    size="small"
                                    variant="standard"
                                    autoComplete="current-password"
                                />
                                <ErrorMessage
                                    errors={errors}
                                    name={`${fieldArrName}.${index}.LocalPWD`}
                                    render={
                                        ({ message }) =>
                                            <Typography color={(theme) => {
                                                return theme.palette.error.main;
                                            }}>
                                                * {message}
                                            </Typography>
                                    }
                                />
                            </Stack>
                            
                            <TextField
                                label="Email"
                                {...register(`${fieldArrName}.${index}.Email`)}
                                size="small"
                                variant="standard"
                                autoComplete="current-password"
                            />
                            <TextField
                                label="Phone"
                                {...register(`${fieldArrName}.${index}.Phone`)}
                                size="small"
                                variant="standard"
                                autoComplete="current-password"
                            />
                            <Box>
                                <InputLabel variant="standard" id={`${fieldArrName}.${index}.IsAdmin-label`} >
                                    Administrator
                                </InputLabel>
                                <Controller name={`${fieldArrName}.${index}.IsAdmin`} control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select labelId={`${fieldArrName}.${index}.IsAdmin-label`} {...field} size="small"
                                                //Currently, it hasn't supported the setValueAs property, it only supports in registered option
                                                //So that, it necessary to implment at onChange event here
                                                onChange={(e) => field.onChange(e.target.value == "true")}>
                                                <MenuItem value="true">Yes</MenuItem>
                                                <MenuItem value="false">No</MenuItem>
                                            </Select>
                                        );
                                    }} />
                            </Box>
                            <Box>
                                <InputLabel variant="standard" id={`${fieldArrName}.${index}.Status-label`} >
                                    Activiation
                                </InputLabel>
                                <Controller name={`${fieldArrName}.${index}.Status`} control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select labelId={`${fieldArrName}.${index}.Status-label`} {...field} size="small">
                                                <MenuItem value="A">Active</MenuItem>
                                                <MenuItem value="I">Inactive</MenuItem>
                                            </Select>
                                        );
                                    }}
                                />
                            </Box>                            
                        </CardContent>
                    );
                })
            }
        </>
    );
});

export default UserAddFormList;