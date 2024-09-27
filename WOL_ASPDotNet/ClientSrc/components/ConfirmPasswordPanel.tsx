import { useState, useRef, forwardRef, useImperativeHandle } from 'react';

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import FeedbackIcon from '@mui/icons-material/Feedback';


interface ConfirmPasswordPanelProps {
    displayPlainText?: boolean
}

export type ConfirmPasswordPanelHandler = {
    validate: () => boolean,
    getConfirmedPassword: () => string
}


const ConfirmPasswordPanel = forwardRef<ConfirmPasswordPanelHandler, ConfirmPasswordPanelProps>((props, ref) => {
    const { displayPlainText = true } = props;
    const displayType = (displayPlainText ? "text" : "password");
    const newPwdRef = useRef<HTMLInputElement>(null);
    const confirmPwdRef = useRef<HTMLInputElement>(null);
    const [isPwdConsistent, setIsPwdConsistent] = useState<boolean>(true);
    const [isTipOpen, setIsTipOpen] = useState(true);

    useImperativeHandle(ref, () => ({
        validate: () => {
            if (!newPwdRef.current?.value || !confirmPwdRef.current?.value) {
                setIsPwdConsistent(false);
                setIsTipOpen(true);
                return false;
            }


            if (newPwdRef.current?.value === confirmPwdRef.current?.value) {
                setIsPwdConsistent(true);
                setIsTipOpen(true);
                return true;
            } 

            setIsPwdConsistent(false);
            setIsTipOpen(true);
            return false;
        },
        getConfirmedPassword: () => confirmPwdRef.current?.value!
    }));

    return (
        <form>
            <TextField
                type={displayType}
                label="New Password"
                size="small"
                variant="standard"
                autoComplete="current-password"
                inputRef={newPwdRef}
            />
            <Stack direction="row" alignItems="flex-end" gap={1}>
                <TextField
                    type={displayType}
                    label="Confirm Password"
                    size="small"
                    variant="standard"
                    autoComplete="current-password"
                    inputRef={confirmPwdRef}
                />
                <Box sx={{
                        flexGrow: "1"
                    }}
                    onMouseEnter={() => { setIsTipOpen(true); }}
                    onMouseLeave={() => { setIsTipOpen(false); }}>
                    {
                        !isPwdConsistent
                            ?
                            <Tooltip arrow open={isTipOpen}
                                placement="right-end"
                                title="Password is not consistent!"
                            >
                                <FeedbackIcon sx={{
                                    color: "#FF8C00"
                                }} />
                            </Tooltip>
                            :
                            <></>
                    }
                </Box>
            </Stack>            
        </form>    
    );
});

export default ConfirmPasswordPanel;