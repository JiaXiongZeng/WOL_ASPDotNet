import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Guacamole from 'guacamole-common-js';
import styled from '@mui/material/styles/styled';
import Box from '@mui/material/Box';
import Popper from '@mui/material/Popper';
import PopupState, { bindPopper, bindHover } from 'material-ui-popup-state';
import Slide from '@mui/material/Slide';
import Paper from '@mui/material/Paper';
//import Typography from '@mui/material/Typography';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

import { FullScreen, useFullScreenHandle } from "react-full-screen";

import axios from 'axios';

import { GatewayParametersViewModel } from '@models/GatewayParametersViewModel';

import * as lodash from 'lodash';

const styles = {
    arrow: {
        position: 'absolute',
        fontSize: 7,
        width: '3em',
        height: '3em',
        '&::before': {
            content: '""',
            margin: 'auto',
            display: 'block',
            width: 0,
            height: 0,
            borderStyle: 'solid',
        },
    }
};
const StyledPopper = styled(Popper)(({ theme }) => ({ // You can replace with `PopperUnstyled` for lower bundle size.
    zIndex: 1,
    maxWidth: '375px',
    width: '100%',
    '&[data-popper-placement*="bottom"] .arrow': {
        top: 0,
        left: 0,
        marginTop: '-0.9em',
        width: '3em',
        height: '1em',
        '&::before': {
            borderWidth: '0 1em 1em 1em',
            borderColor: `transparent transparent ${theme.palette.background.paper} transparent`,
        },
    },
    '&[data-popper-placement*="top"] .arrow': {
        bottom: 0,
        left: 0,
        marginBottom: '-0.9em',
        width: '3em',
        height: '1em',
        '&::before': {
            borderWidth: '1em 1em 0 1em',
            borderColor: `${theme.palette.background.paper} transparent transparent transparent`,
        },
    },
    '&[data-popper-placement*="right"] .arrow': {
        left: 0,
        marginLeft: '-0.9em',
        height: '3em',
        width: '1em',
        '&::before': {
            borderWidth: '1em 1em 1em 0',
            borderColor: `transparent ${theme.palette.background.paper} transparent transparent`,
        },
    },
    '&[data-popper-placement*="left"] .arrow': {
        right: 0,
        marginRight: '-0.9em',
        height: '3em',
        width: '1em',
        '&::before': {
            borderWidth: '1em 0 1em 1em',
            borderColor: `transparent transparent transparent ${theme.palette.background.paper}`,
        },
    },
}));

const RemoteGateway = () => {
    const occupaciedHeight = 120;
    const containerRef = useRef<Nullable<HTMLDivElement>>(null);
    const [arrowRef, setArrowRef] = useState<Nullable<HTMLSpanElement>>(null);

    const fullScreenHandle = useFullScreenHandle();

    const { state } = useLocation();
    const params: GatewayParametersViewModel = state;

    const navigate = useNavigate();
    const navigateTo = (route: string) => {
        navigate(route, { replace: true });
    }

    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        //const tunnel = new Guacamole.WebSocketTunnel("ws://localhost:8088/connect");
        const tunnel = new Guacamole.WebSocketTunnel(params.GuacamoleSharpWebSocket!);
        const client = new Guacamole.Client(tunnel);

        // Client error handler
        client.onerror = (_error) => {
            //console.log(_error);
        };

        // When tunnel close, go back to the host list
        tunnel.onstatechange = (state) => {
            if (state == Guacamole.Tunnel.State.CLOSED) {
                navigateTo("/");
            }
        };

        //The canvas for drawing screen
        const display = client.getDisplay().getElement();
        containerRef.current?.appendChild(display);

        //The input sink
        const sink = new Guacamole.InputSink();
        display.appendChild(sink.getElement());
        sink.focus();

        // Keyboard events
        //const kb = new Guacamole.Keyboard(document);
        const kb = new Guacamole.Keyboard(sink.getElement());
        kb.onkeydown = (keysym: number) => {
            client.sendKeyEvent(1, keysym);
        };

        kb.onkeyup = (keysym: number) => {
            client.sendKeyEvent(0, keysym);
        };

        // Mouse events
        var mouse = new Guacamole.Mouse(containerRef.current!);
        mouse.onEach(
            ["mousedown", "mouseup", "mousemove"],
            () => {
                client.sendMouseState(mouse.currentState);
            });

        // Window events
        window.onpagehide = () => {
            client.disconnect();
        };

        window.onresize = lodash.debounce(() => {
            let GUAC_WIDTH = Math.round(containerRef.current?.clientWidth!);
            let GUAC_HEIGHT = Math.round(window.innerHeight - occupaciedHeight);
            //---- Resize window by sendMessage to the Guacamole Server
            client.sendSize(GUAC_WIDTH, GUAC_HEIGHT);
        }, 100, {
            trailing: true
        });

        const buildConn = async () => {
            //Get the arguments from the router
            //console.log(`${params.GuacamoleSharpWebSocket},${params.GuacamoleSharpTokenURL},${params.GuacamoleSharpTokenPhrase},${params.Type},${params.Ip},${params.Port},${params.Domain},${params.UserName},${params.Password}`);

            let sendArgs: Nullable<{ [key: string]: any }> = {
                "arguments": {
                    "hostname": params.Ip,
                    "width": `${containerRef.current?.offsetWidth}`,
                    "height": `${window.innerHeight - occupaciedHeight}`
                },
                "type": params.Type
            };

            const argumentsPart = sendArgs["arguments"];
            if (lodash.isNumber(params.Port)) {
                argumentsPart["port"] = `${params.Port}`;
            }

            if (params.UserName) {
                argumentsPart["username"] = params.UserName;
            }

            if (params.Password) {
                argumentsPart["password"] = params.Password;
            }

            if (params.Domain) {
                argumentsPart["domain"] = params.Domain;
            }

            if (params.Type == "RDP") {
                argumentsPart["ignore-cert"] = "true";
            }

            const tokenURL = `${params.GuacamoleSharpTokenURL}/${params.GuacamoleSharpTokenPhrase}`;
            await axios.post<string>(tokenURL, sendArgs)
                .then(resp => {
                    const token = resp.data;
                    client.connect(`token=${token}`);
                }).catch(err => {
                    console.log(err);
                });

            //const sshArgs = {
            //    "arguments": {
            //        "hostname": "10.77.110.47",
            //        "port": "22",
            //        "width": `${containerRef.current?.offsetWidth}`,
            //        "height": `${window.innerHeight - occupaciedHeight}`
            //    },
            //    "type": "ssh"
            //};

            //await axios.post<string>('http://localhost:8088/token/aA1234567', sendArgs)
            //    .then(resp => {
            //        const token = resp.data;
            //        client.connect(`token=${token}`);
            //    }).catch(err => {
            //        console.log(err);
            //    });
        }
        buildConn();

        return () => {
            containerRef.current?.removeChild(display);
            client.disconnect();
        }
    }, []);

    return (
        <PopupState variant="popper" popupId="screenPopper">
            {(popupState) => (
                <>
                    <FullScreen
                        handle={fullScreenHandle}
                        onChange={(state) => {                            
                            setIsFullScreen(state);
                        }} >
                        <Box component="div" {...bindHover(popupState)}
                            sx={{
                                display: "flex",
                                flexGrow: 1,
                                padding: 0,
                                margin: 0,
                                marginTop: 1,
                            }}
                            ref={containerRef}>
                        </Box>
                    </FullScreen>                    
                    <StyledPopper
                        {...bindPopper(popupState)}
                        placement="top"
                        disablePortal={false}
                        transition={true}
                        sx={{
                            zIndex: "1300",
                            width: "auto"
                        }}
                        modifiers={[
                        {
                            name: 'flip',
                            enabled: true,
                            options: {
                                altBoundary: true,
                                rootBoundary: 'document',
                                padding: 8,
                            },
                        },
                        {
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                                altAxis: true,
                                altBoundary: true,
                                tether: true,
                                rootBoundary: 'document',
                                padding: 8,
                            },
                        },
                        {
                            name: 'arrow',
                            enabled: true,
                            options: {
                                element: arrowRef,
                            },
                        },
                        ]}>
                        {({ TransitionProps }) => (
                            <Slide in={true} direction="right" container={containerRef.current} {...TransitionProps} timeout={350} >
                                <Paper sx={{
                                    borderRadius: "20px 20px 0 0",
                                    boxShadow: "0px 0px 5px 5px rgba(0, 0, 0, 0.2)",
                                    padding: "2px"
                                }} >
                                    <Box component="span" className="arrow" ref={setArrowRef} sx={styles.arrow} />
                                    <Box
                                        sx={{
                                            width: "200px",
                                            height: "35px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",                                            
                                        }} >
                                        {
                                            !isFullScreen
                                                ?
                                                <Tooltip arrow title="Enter full screen mode">
                                                    <IconButton onClick={async () => {
                                                        await fullScreenHandle.enter();
                                                    }} >
                                                        <OpenInFullIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                :
                                                <Tooltip arrow title="Leave full screen mode">
                                                    <IconButton onClick={async () => {
                                                        await fullScreenHandle.exit();
                                                    }} >
                                                        <CloseFullscreenIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                        }                                        
                                    </Box>
                                </Paper>                                
                            </Slide>
                        )}
                    </StyledPopper>
                </>
            )}
        </PopupState>
    );
}

export default RemoteGateway;