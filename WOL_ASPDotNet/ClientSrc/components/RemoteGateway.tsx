import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Guacamole from 'guacamole-common-js';
import styled from '@mui/material/styles/styled';
import Box from '@mui/material/Box';
import Popper from '@mui/material/Popper';
import PopupState, { bindPopper, bindHover } from 'material-ui-popup-state';
import Slide from '@mui/material/Slide';
import Paper from '@mui/material/Paper';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import FileCopyIcon from '@mui/icons-material/FileCopy';

import { FullScreen, useFullScreenHandle } from "react-full-screen";
import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';
import { FileExplorer } from '@components/FileExplorer';
import { GatewayParametersViewModel } from '@models/GatewayParametersViewModel';

import axios from 'axios';
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

const base64ToBlob = (base64String: string, mimeType: string) => {
    const base64WithoutPrefix = base64String.split(',')[1] || base64String;
    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Uint8Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    return new Blob([byteNumbers], { type: mimeType });
}

const blobToBase64 = (blob: Blob) => {
    return new Promise<string>((res, _) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result as string);
        reader.readAsDataURL(blob);
    });
}

const RemoteGateway = () => {
    const occupaciedWidth = 40;
    const occupaciedHeight = 120;
    const containerRef = useRef<Nullable<HTMLDivElement>>(null);
    const [arrowRef, setArrowRef] = useState<Nullable<HTMLSpanElement>>(null);
    const modalRef = useRef<CustomizedDialogHandler>(null);

    const fullScreenHandle = useFullScreenHandle();

    const { state } = useLocation();
    const params: GatewayParametersViewModel = state;

    const navigate = useNavigate();
    const navigateTo = (route: string) => {
        refIsConfirmDisconnect.current = false;
        navigate(route, { replace: true });
    }

    const refIsConfirmDisconnect = useRef<boolean>(false);
    const refTunnel = useRef<Nullable<Guacamole.Tunnel>>(null);
    const refClient = useRef<Nullable<Guacamole.Client>>(null);
    const refSink = useRef<Nullable<Guacamole.InputSink>>(null);
    const refFileSystem = useRef<Nullable<Guacamole.Object>>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const resizeScreen = useCallback(
        lodash.debounce(() => {
            const GUAC_WIDTH = Math.round(window.innerWidth - (!isFullScreen ? occupaciedWidth: 5));
            const GUAC_HEIGHT = Math.round(window.innerHeight - (!isFullScreen ? occupaciedHeight : 10));
            //---- Resize window by sendMessage to the Guacamole Server
            refClient.current?.sendSize(GUAC_WIDTH, GUAC_HEIGHT);
        }, 50, {
            trailing: true
        })
    , [isFullScreen]);

    useEffect(() => {
        window.addEventListener('resize', resizeScreen);
        resizeScreen();
        refSink.current?.focus();

        return () => {
            window.removeEventListener('resize', resizeScreen);
        }
    }, [resizeScreen]);

    useEffect(() => {
        //const tunnel = new Guacamole.WebSocketTunnel("ws://localhost:8088/connect");
        const tunnel = new Guacamole.WebSocketTunnel(params.GuacamoleSharpWebSocket!);
        refTunnel.current = tunnel;

        const client = new Guacamole.Client(tunnel);
        refClient.current = client;

        // Client error handler
        client.onerror = (_error) => {
            //console.log(_error);
        };

        // Copy from remote host
        client.onclipboard = async (inStream, mimeType) => {
            inStream.onblob = async (data64) => {
                const blob = base64ToBlob(data64, mimeType);

                const clipboardItem = new ClipboardItem({
                    [mimeType]: blob
                });

                await navigator.clipboard.write([clipboardItem]).catch(error => {
                    console.log(error);
                });

                inStream.sendAck("OK", Guacamole.Status.Code.SUCCESS);
            };
        }

        // Copy to remote host
        window.onfocus = async () => {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    const blob = await clipboardItem.getType(type);                    
                    const blobAsDataUrl = await blobToBase64(blob);
                    const blobAsB64 = blobAsDataUrl.split(",")[1];

                    const outStream = client.createClipboardStream(type);
                    outStream.sendBlob(blobAsB64);
                    outStream.sendEnd();
                }
            }
        }

        client.onfilesystem = async (object, name) => {
            refFileSystem.current = object;

            object.onbody = (inStream, mimeType) => {
                inStream.sendAck("OK", Guacamole.Status.Code.SUCCESS);
                console.log(inStream);
                console.log(mimeType);
                console.log(name);

                inStream.onblob = (data) => {
                    //console.log(data);
                    const blob = base64ToBlob(data, mimeType);
                    console.log(blob);

                    inStream.sendAck("OK", Guacamole.Status.Code.SUCCESS);
                }

                inStream.onend = () => {
                    if (mimeType.indexOf('stream-index+json') != -1) {
                        //代表是資料夾，向下鑽取 (可以用成UI表示)
                    } else {
                        //代表是檔案，可以下載或進行刪除
                    }
                }
            }
        }

        // When tunnel close, go back to the host list
        tunnel.onstatechange = (state) => {
            if (state == Guacamole.Tunnel.State.CLOSED) {
                if (params.Type == "SSH") {
                    navigateTo("/");                    
                } else {
                    //If the type is not conosle related type,
                    //make a tolerence for 8 secs to leave(maybe some network jammed)
                    if (refIsConfirmDisconnect.current) {
                        navigateTo("/");
                    } else {                        
                        setTimeout(() => {
                            if (refIsConfirmDisconnect.current) {
                                navigateTo("/");
                            }
                        }, 8000);
                    }
                }
            } else {
                refIsConfirmDisconnect.current = false;
            }
        };

        //The canvas for drawing screen
        const display = client.getDisplay().getElement();
        //dont let the canvas overflow when the mouse point at the edge
        display.style.overflow = "hidden";
        //dont show the host pointer on the canvas (avoiding see double overlapping pointers)
        display.style.cursor = "none";
        containerRef.current?.appendChild(display);

        //The input sink
        const sink = new Guacamole.InputSink();
        display.appendChild(sink.getElement());
        sink.focus();
        refSink.current = sink;

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
        const mouse = new Guacamole.Mouse(containerRef.current!);
        mouse.onEach(
            ["mousedown", "mouseup", "mousemove"],
            () => {
                client.sendMouseState(mouse.currentState);
            });

        // Window events
        window.onpagehide = () => {
            client.disconnect();
        };

        const buildConn = async () => {
            //Get the arguments from the router
            //console.log(`${params.GuacamoleSharpWebSocket},${params.GuacamoleSharpTokenURL},${params.GuacamoleSharpTokenPhrase},${params.Type},${params.Ip},${params.Port},${params.Domain},${params.UserName},${params.Password}`);

            const sendArgs: Nullable<{ [key: string]: any }> = {
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
                //Log in related
                argumentsPart["ignore-cert"] = "true";

                //Client screen resize
                argumentsPart["resize-method"] = "display-update";

                //UI Effect
                argumentsPart["enable-wallpaper"] = "true";
                argumentsPart["enable-full-window-drag"] = "true";

                //File transfer
                argumentsPart["enable-sftp"] = "true";
                argumentsPart["sftp-password"] = params.Password;
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
                        <CustomizedDialog
                            title="Data Transfer"
                            open={false}
                            showClose={true}                            
                            maxWidth="md"
                            fullWidth={true}
                            ref={modalRef} >
                            <FileExplorer />
                        </CustomizedDialog>
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
                                            justifyContent: "space-between",
                                            paddingLeft: "1em",
                                            paddingRight: "1em"
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
                                        <Tooltip arrow title="File transfer" onClick={() => {
                                            //從根目錄 / 開始向Guacamole詢問路徑是否為檔案或目錄
                                            /*let path = `/`;
                                            refFileSystem.current?.requestInputStream(path);*/
                                            modalRef.current?.setOpen(true);
                                        }} >
                                            <IconButton>
                                                <FileCopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip arrow title="Disconnect from remote service">
                                            <IconButton onClick={async () => {
                                                if (refTunnel.current?.isConnected()) {
                                                    refIsConfirmDisconnect.current = true;
                                                    refClient.current?.disconnect();
                                                } else {
                                                    navigateTo("/");
                                                }
                                            }} >
                                                <PowerOffIcon />
                                            </IconButton>
                                        </Tooltip>
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