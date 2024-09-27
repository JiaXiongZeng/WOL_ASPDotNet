import { FormEvent, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@mui/material/styles/styled';
import blue from '@mui/material/colors/blue';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import axios from 'axios';

import { LoginCredential } from '@models/LoginCredential';
import { UserInfo } from '@models/UserInfo';
import { Configurations } from '@models/Configurations';
import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';

import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';
import { ConfigDispatchContext, ConfigActionKind } from '@components/ConfigContext';
import { AuthDispatchContext, AuthActionKind } from '@components/AuthContext';

const StyledDiv = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
}));

const StyledForm = styled("form")(({ theme }) => ({
    width: '100%',
    marginTop: theme.spacing(1)
}));

const StyledSubmit = styled(Button)(({ theme }) => ({
    margin: theme.spacing(3, 0, 2),
    backgroundColor: blue[500],
    '&:hover': {
        backgroundColor: blue[700],
    }
}));

type ApiIdentityResponse = ResponseMessage<UserInfo>;

type ApiConfigResponse = ResponseMessage<Configurations>;

// Functional component for Login screen
export const LoginScreenLocal = () => {
    const [uID, setUID] = useState<Nullable<string>>(null);
    const [pwd, setPWD] = useState<Nullable<string>>(null);
    const configDispatch = useContext(ConfigDispatchContext);
    const authDispatch = useContext(AuthDispatchContext);
    const navigate = useNavigate();

    const modalRef = useRef<CustomizedDialogHandler>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const data: LoginCredential = {
            UserID: uID!,
            Password: pwd!
        };

        //Login first
        const loginProcess = axios.post<ApiIdentityResponse>("/Identity/Login", data, {
            responseType: "json"
        }).then(resp => {
            const respData = resp.data;
            if (respData.Status == MESSAGE_STATUS.OK) {
                //Make the login status change to "logged in" at the provider level
                if (respData.Attachment) {
                    authDispatch!({
                        actionKind: AuthActionKind.SET,
                        args: [respData.Attachment]
                    });
                }
            } else {
                //modalRef.current?.setOpen(true);
                throw new Error(respData.Message);
            }
        });

        

        //First, login
        //And then load configurations
        //Finally, redirect to the index page
        Promise.all([loginProcess])
            .then(() => {
                const loadConfigProcess = axios.get<ApiConfigResponse>("/Config/GetBasic", {
                    responseType: "json"
                }).then(resp => {
                    const respData = resp.data;
                    if (respData.Attachment) {
                        configDispatch!({
                            actionKind: ConfigActionKind.SET,
                            args: [respData.Attachment]
                        });
                    }
                });
                return loadConfigProcess;
            })
            .then(() => {
                navigate("/", { replace: true });
            })
            .catch((e) => {
                modalRef.current?.setContentPanel
                    (
                        <Typography gutterBottom>
                            {e.message}
                        </Typography>
                    );
                modalRef.current?.setOpen(true);
            });
    };

    return (
      <Container component="main" maxWidth="xs">
          <StyledDiv>
            <Typography component="h1" variant="h5">
                WOL ASP.NET Core
            </Typography>
                <StyledForm onSubmit={handleSubmit}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoFocus
                        autoComplete="username"
                        onChange={(e) => {
                            setUID(e.target.value);
                        }}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        onChange={(e) => {
                            setPWD(e.target.value);
                        }}
                    />
                    <StyledSubmit
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                    >
                    Sign in
                    </StyledSubmit>
            </StyledForm>
          </StyledDiv>
          <CustomizedDialog
                title="Warning"
                open={false}
                autoClose={1000}
                ref={modalRef}  >
          </CustomizedDialog>
      </Container>
    );
};

export default LoginScreenLocal;