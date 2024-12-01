import { useState, useRef, useEffect, useCallback } from 'react';
import { useImmer } from 'use-immer';
import { useNavigate, useLocation } from 'react-router-dom';
import Guacamole from 'guacamole-common-js';
import { Mimetype } from 'guacamole-common-js/lib/GuacCommon';
import styled from '@mui/material/styles/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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

import axios from 'axios';
import * as lodash from 'lodash';
import { v4 as uuidV4 } from 'uuid';
import { showDirectoryPicker, FileSystemDirectoryHandle } from 'native-file-system-adapter';
import { PromisePool } from '@supercharge/promise-pool';
import dayjs from 'dayjs';

import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';
import { FileExplorer, FileExplorerHandler, LocalFsNodeType } from '@components/FileExplorer';
import { GatewayParametersViewModel } from '@models/GatewayParametersViewModel';
import { TransferTask, genHumanlikeSizeDesc, getFileName } from '@models/TransferTask';
import { FrontendFileHandleUtil, FileToBlob } from '@utilities/FrontendFileHandleUtility';
import { MakePromise } from '@utilities/PromiseUtility';


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

//OnBody event handle arugment type
type OnBodyArgs = {
    inStream: Guacamole.InputStream,
    mimeType: Mimetype,
    path: string,
    task?: TransferTask,
    promiseExecutor?: {
        resolve: (value: unknown) => void,
        reject: (reason?: any) => void
    }
    onDownloadSuccess?: () => void,
    onDownloadFailed?: (e: unknown) => void,
    onDownloadFinished?: () => void
}

const RemoteGateway = () => {
    const occupaciedWidth = 40;
    const occupaciedHeight = 120;
    const containerRef = useRef<Nullable<HTMLDivElement>>(null);
    const [arrowRef, setArrowRef] = useState<Nullable<HTMLSpanElement>>(null);
    const modalRef = useRef<CustomizedDialogHandler>(null);
    const modalHintRef = useRef<CustomizedDialogHandler>(null);

    const fullScreenHandle = useFullScreenHandle();

    const { state } = useLocation();
    const params: GatewayParametersViewModel = state;

    const navigate = useNavigate();
    const navigateTo = (route: string) => {
        refIsConfirmDisconnect.current = false;
        navigate(route, { replace: true });
    }

    const refFileExplorer = useRef<FileExplorerHandler>(null);
    const refIsConfirmDisconnect = useRef<boolean>(false);
    const refTunnel = useRef<Nullable<Guacamole.Tunnel>>(null);
    const refClient = useRef<Nullable<Guacamole.Client>>(null);
    const refSink = useRef<Nullable<Guacamole.InputSink>>(null);
    const refFileSystem = useRef<Nullable<Guacamole.Object>>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const refLocalFileExpRoot = useRef<Nullable<FileSystemDirectoryHandle>>(null);

    const [downloadTasks, setDownloadTasks] = useImmer<TransferTask[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);

    const [uploadTasks, setUploadTasks] = useImmer<TransferTask[]>([]);
    const [isUploading, setIsUploading] = useState(false);

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

    const onBody = async ({ inStream, mimeType, path,
                            task,
                            promiseExecutor,
                            onDownloadSuccess, 
                            onDownloadFailed,
                            onDownloadFinished }: OnBodyArgs) => {

        inStream.sendAck("OK", Guacamole.Status.Code.SUCCESS);

        const blobReader = new Guacamole.BlobReader(inStream, mimeType);

        //查看下載進度
        blobReader.onprogress = lodash.throttle((_length) => {
            if (!task) return;
            //只看檔案下載Size，資料夾結構Json不用看
            if (mimeType.indexOf('stream-index+json') == -1) {
                setDownloadTasks((draft) => {
                    const theTask = lodash.find(draft, x => x.Id == task.Id);
                    if (!theTask) return;
                    if (!theTask.CurrentTransStatus) return;

                    theTask.PreviousTransStatus = {
                        //前次紀錄的下載Size
                        ProcessedSize: theTask.CurrentTransStatus.ProcessedSize,
                        //前次紀錄的時間
                        TriggerTime: theTask.CurrentTransStatus.TriggerTime
                    };

                    theTask.CurrentTransStatus = {
                        //目前下載的Size
                        ProcessedSize: blobReader.getLength(),
                        //當下的時間
                        TriggerTime: new Date()
                    };

                    /**  Calculate the time difference  **/
                    const dateCurrent = dayjs(theTask.CurrentTransStatus.TriggerTime);
                    const datePrevious = dayjs(theTask.PreviousTransStatus.TriggerTime);
                    //The miminal observation interval is 1 second
                    const diffSeconds = dateCurrent.diff(datePrevious, 'second') || 1;

                    /**  Calculate the size difference  **/
                    const sizeCurrent = theTask.CurrentTransStatus.ProcessedSize;
                    const sizePrevious = theTask.PreviousTransStatus.ProcessedSize;
                    const diffSize = sizeCurrent - sizePrevious!;

                    /** Generate the humanlike data transfer information **/
                    const transferRate = Math.ceil(diffSize / diffSeconds);
                    const hmlSize = genHumanlikeSizeDesc(theTask.CurrentTransStatus.ProcessedSize);
                    const hmlRate = genHumanlikeSizeDesc(transferRate);
                    theTask.TotalSize = `${hmlSize.Size} ${hmlSize.Unit}`;
                    theTask.TransferRate = `${hmlRate.Size} ${hmlRate.Unit}`;

                    console.log(`[${theTask.Action}] File name: "${theTask.FileName}", Total Size: ${theTask.TotalSize}, Transfer Rate: ${theTask.TransferRate}`);
                });
            }
        }, 1000, { trailing: true });

        blobReader.onend = () => {
            const doDownload = async () => {
                try {
                    const blob = blobReader.getBlob();
                    if (mimeType.indexOf('stream-index+json') != -1) {
                        const strText = await blob.text();
                        const fileList: { [key: string]: string } = JSON.parse(strText);
                        refFileExplorer.current?.renewRemoteFsNodes(fileList);
                    } else {
                        try {
                            //Save as a local file
                            //console.log(`${path}\n`);
                            //console.log(await blob.text());

                            const folderNodes = refFileExplorer.current?.getLocalSelectedFolderNodes();
                            lodash.forEach(folderNodes, async (node) => {
                                const dirHandle = await FrontendFileHandleUtil.getNestedDirectoryHandle(refLocalFileExpRoot.current!, node.id);

                                const idxOfLastSlash = path.lastIndexOf('/');
                                const fileName = path.substring(idxOfLastSlash + 1);
                                const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });

                                const writer = await fileHandle.createWritable();
                                await writer.write(blob);
                                await writer.close();

                                //Call on download success callback (Maybe some promise in it)
                                onDownloadSuccess && onDownloadSuccess();

                                //Promise resolve
                                promiseExecutor && promiseExecutor.resolve("Success");
                            });
                        } catch (e) {
                            //Call on download failed callback (Maybe some promise in it)
                            onDownloadFailed && onDownloadFailed(e);
                            console.log(e);

                            //Promise reject
                            promiseExecutor && promiseExecutor.reject(e);
                        } finally {
                            //No matter download success or failed call the finished callback
                            onDownloadFinished && onDownloadFinished();
                        }
                    }
                } catch (e) {
                    //Promise reject
                    promiseExecutor && promiseExecutor.reject(e);

                    console.log(e);
                }
            }
            doDownload();
        }
    }

    useEffect(() => {
        if (isDownloading) {
            const queueTasksInPool = async () => {
                await PromisePool.for(downloadTasks)
                    .withConcurrency(4)
                    .useCorrespondingResults()
                    .onTaskStarted((item, _pool) => {
                        setDownloadTasks(draft => {
                            const theTask = lodash.find(draft, x => x.Id == item.Id)!;
                            theTask.CurrentTransStatus = {
                                ProcessedSize: 0,
                                TriggerTime: new Date()
                            };
                            theTask.PreviousTransStatus = { ...theTask.CurrentTransStatus };
                            theTask.TaskStatus = 'Running';
                        });
                    })
                    .onTaskFinished((item, pool) => {
                        setDownloadTasks(draft => {
                            const theTask = lodash.find(draft, x => x.Id == item.Id)!;
                            theTask.TaskStatus = 'Success';

                            //Count the running tasks from badgeCount
                            const badgeCount = lodash.filter(draft, x => x.TaskStatus == 'Running').length;

                            refFileExplorer.current?.setDownloadProgress(pool.processedPercentage());
                            refFileExplorer.current?.setDownloadBadgeCount(badgeCount);
                        });
                    })
                    .handleError(async (_error, item) => {
                        setDownloadTasks(draft => {
                            const theTask = lodash.find(draft, x => x.Id == item.Id)!;
                            theTask.TaskStatus = 'Error';
                        });
                    })
                    .process(async (task, index, pool) => {
                        await task.RunTask({ index, pool });
                    });

                setIsDownloading(false);
                refFileExplorer.current?.setDownloadEnabled(true);
            }
            queueTasksInPool();
        }
    }, [isDownloading]);

    useEffect(() => {
        if (isUploading) {
            const queueTasksInPool = async () => {
                await PromisePool.for(uploadTasks)
                    .withConcurrency(4)
                    .useCorrespondingResults()
                    .onTaskStarted((item, _pool) => {
                        setUploadTasks(draft => {
                            const theTask = lodash.find(draft, x => x.Id == item.Id)!;
                            theTask.CurrentTransStatus = {
                                ProcessedSize: 0,
                                TriggerTime: new Date()
                            };
                            theTask.PreviousTransStatus = { ...theTask.CurrentTransStatus };
                            theTask.TaskStatus = 'Running';
                        });
                    })
                    .onTaskFinished((item, pool) => {
                        setUploadTasks(draft => {
                            const theTask = lodash.find(draft, x => x.Id == item.Id)!;
                            theTask.TaskStatus = 'Success';

                            //Count the running tasks from badgeCount
                            const badgeCount = lodash.filter(draft, x => x.TaskStatus == 'Running').length;

                            refFileExplorer.current?.setUploadProgress(pool.processedPercentage());
                            refFileExplorer.current?.setUploadBadgeCount(badgeCount);
                        });
                    })
                    .handleError(async (_error, item) => {
                        setUploadTasks(draft => {
                            const theTask = lodash.find(draft, x => x.Id == item.Id)!;
                            theTask.TaskStatus = 'Error';
                        })
                    })
                    .process(async (task, index, pool) => {
                        await task.RunTask({ index, pool });
                    });

                setIsUploading(false);
                refFileExplorer.current?.setUploadEnabled(true);
            }
            queueTasksInPool();
        }
    }, [isUploading]);

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
            const blobReader = new Guacamole.BlobReader(inStream, mimeType);

            blobReader.onend = () => {
                const copyFromRemote = async () => {
                    try {
                        const blob = blobReader.getBlob();
                        const clipboardItem = new ClipboardItem({
                            [mimeType]: blob
                        });

                        await navigator.clipboard.write([clipboardItem]).catch(error => {
                            console.log(error);
                        });
                    } catch (e) {
                        console.log(e);
                    }
                }
                copyFromRemote();
            }
        }

        // Copy to remote host
        window.onfocus = () => {
            const copyToRemote = async () => {
                try {
                    const clipboardItems = await navigator.clipboard.read();
                    for (const clipboardItem of clipboardItems) {
                        for (const type of clipboardItem.types) {
                            const blob = await clipboardItem.getType(type);
                            const outStream = client.createClipboardStream(type);
                            const writer = new Guacamole.StringWriter(outStream);
                            const text = await blob.text();

                            const CHUNK_SIZE = 4096;
                            for (let i = 0; i < text.length; i += CHUNK_SIZE) {
                                writer.sendText(text.substring(i, i + CHUNK_SIZE));
                            }

                            //Close stream
                            writer.sendEnd();
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            copyToRemote();
        }

        client.onfilesystem = async (object, _name) => {
            refFileSystem.current = object;

            //object.onundefine = () => {
            //    console.log("Guacamole file system undefined");
            //}
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
                argumentsPart["sftp-server-alive-interval"] = "2";
                argumentsPart["api-session-timeout"] = "60";
                argumentsPart["api-max-request-size"] = "0";
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
                            <FileExplorer
                                localFsRootName="/"
                                remoteFsRootName="/"
                                isUploadEnabled={!isUploading}
                                isDownloadEnabled={!isDownloading}
                                onLocalItemToggled={(itemInfo) => {
                                    if (itemInfo.fileType == "storage" || itemInfo.fileType == "folder") {
                                        (async () => {
                                            const parentNode = itemInfo.path;
                                            const dirHandle = await FrontendFileHandleUtil.getNestedDirectoryHandle(refLocalFileExpRoot.current!, parentNode);

                                            const nestedNodes: Record<string, LocalFsNodeType> = {};
                                            for await (const entry of dirHandle.values()) {
                                                nestedNodes[`${lodash.trimEnd(parentNode, "/")}/${entry.name}`] =
                                                {
                                                    isFolder: (entry.kind == 'directory')
                                                };
                                            }

                                            refFileExplorer.current?.renewLocalFsNodes(nestedNodes);
                                        })();
                                    }
                                }}
                                onLocalRefresh={() => {
                                    const pickClientDir = async () => {
                                        try {
                                            //Clear the previous cached handles
                                            FrontendFileHandleUtil.reset();

                                            //Choose the client visible directory
                                            const dirHandle = await showDirectoryPicker();
                                            if (dirHandle) {
                                                refLocalFileExpRoot.current = dirHandle;
                                                refFileExplorer.current?.renewLocalFsNodes({
                                                    ['/' + lodash.trimStart(dirHandle.name, '\\')]: {
                                                        isFolder: true
                                                    }
                                                });
                                            }
                                        } catch (e) {
                                            console.log(e);
                                        }
                                    }
                                    pickClientDir();
                                }}
                                onRemoteItemToggled={(itemInfo) => {
                                    if (itemInfo.fileType == "storage" || itemInfo.fileType == "folder") {
                                        refFileSystem.current?.requestInputStream(itemInfo.path, (inStream, mimeType) => {
                                            onBody({
                                                inStream: inStream,
                                                mimeType: mimeType,
                                                path: itemInfo.path
                                            });
                                        });
                                    }
                                }}
                                onRemoteRefresh={() => {
                                    //從根目錄 / 開始向Guacamole詢問路徑是否為檔案或目錄
                                    refFileSystem.current?.requestInputStream('/', (inStream, mimeType) => {
                                        onBody({
                                            inStream: inStream,
                                            mimeType: mimeType,
                                            path: '/'
                                        });
                                    });
                                }}
                                onDownload={(filePathes) => {
                                    if (filePathes.length == 0) {
                                        modalHintRef.current?.setContentPanel(
                                            <Typography variant="h6" gutterBottom>
                                                Please choose file(s) want to be downloaded from remote host
                                            </Typography>
                                        )
                                        modalHintRef.current?.setOpen(true);
                                        return;
                                    }

                                    if (!refLocalFileExpRoot.current) {
                                        modalHintRef.current?.setContentPanel(
                                            <Typography variant="h6" gutterBottom>
                                                Please choose the local host folder first
                                            </Typography>
                                        )
                                        modalHintRef.current?.setOpen(true);
                                        return;
                                    }

                                    const folderNodes = refFileExplorer.current?.getLocalSelectedFolderNodes();
                                    if (folderNodes?.length == 0) {
                                        modalHintRef.current?.setContentPanel(
                                            <Typography variant="h6" gutterBottom>
                                                Please select at least one folder to save downloaded files at local host
                                            </Typography>
                                        )
                                        modalHintRef.current?.setOpen(true);
                                        return;
                                    }

                                    setDownloadTasks(draft => {
                                        //Clear all tasks from download task queue
                                        draft.length = 0;

                                        //Populate new tasks to task queue
                                        lodash.forEach(filePathes, path => {
                                            const newTask: TransferTask = {
                                                Id: uuidV4(),
                                                FileName: getFileName(path),
                                                Action: 'Download',
                                                TaskStatus: 'Queue',
                                                RunTask: (/*{ index, pool }*/) => {
                                                    //console.log(index);
                                                    //console.log(pool);

                                                    return MakePromise((resolve, reject) => {
                                                        refFileSystem.current?.requestInputStream(path, (inStream, mimeType) => {
                                                            onBody({
                                                                inStream: inStream,
                                                                mimeType: mimeType,
                                                                path: path,
                                                                task: newTask,
                                                                promiseExecutor: {
                                                                    resolve,
                                                                    reject
                                                                }
                                                            });
                                                        });
                                                    });
                                                }
                                            };
                                            draft.push(newTask);
                                        });

                                        setIsDownloading(true);
                                        refFileExplorer.current?.setDownloadEnabled(false);
                                        refFileExplorer.current?.setDownloadProgress(0);
                                        refFileExplorer.current?.setDownloadBadgeCount(filePathes.length);
                                    });
                                }}
                                onUpload={(filePathes) => {
                                    if (!refLocalFileExpRoot.current) {
                                        modalHintRef.current?.setContentPanel(
                                            <Typography variant="h6" gutterBottom>
                                                Please choose the local host folder first
                                            </Typography>
                                        )
                                        modalHintRef.current?.setOpen(true);
                                        return;
                                    }

                                    if (filePathes.length == 0) {
                                        modalHintRef.current?.setContentPanel(
                                            <Typography variant="h6" gutterBottom>
                                                Please choose file(s) want to be uploaded from local host
                                            </Typography>
                                        )
                                        modalHintRef.current?.setOpen(true);
                                        return;
                                    }

                                    const remoteDirNodes = refFileExplorer.current?.getRemoteSelectedFolderNodes();
                                    if (remoteDirNodes?.length == 0) {
                                        modalHintRef.current?.setContentPanel(
                                            <Typography variant="h6" gutterBottom>
                                                Please select at least one folder to save uploaded files at remote host
                                            </Typography>
                                        )
                                        modalHintRef.current?.setOpen(true);
                                        return;
                                    }
                                    
                                    //Request to upload files to the remote host
                                    const lastDirNode = lodash.last(remoteDirNodes)!;
                                    const destDirPath = lastDirNode.id;

                                    //The list of tasks for generating upload tasks
                                    let promises: Promise<TransferTask>[] = [];

                                    //Generate upload tasks
                                    lodash.forEach(filePathes, path => {
                                        const runAsync = async () => {
                                            const fileHandle = await FrontendFileHandleUtil.getNestedFileHandle(refLocalFileExpRoot.current!, path);
                                            const file = await fileHandle.getFile();


                                            const destFilePath = `${destDirPath}/${file.name}`;

                                            const newTask: TransferTask = {
                                                Id: uuidV4(),
                                                FileName: file.name,
                                                Action: 'Upload',
                                                TaskStatus: 'Queue',
                                                RunTask: (/*{ index, pool }*/) => {
                                                    //console.log(index);
                                                    //console.log(pool);

                                                    return MakePromise(async (resolve, reject) => {
                                                        const outStream = refFileSystem.current?.createOutputStream(file.type, destFilePath);
                                                        if (outStream) {
                                                            const blob = await FileToBlob(file);
                                                            const blobWriter = new Guacamole.BlobWriter(outStream);

                                                            //查看上傳進度
                                                            blobWriter.onprogress = lodash.throttle((_blob, offset) => {
                                                                setUploadTasks((draft) => {
                                                                    const theTask = lodash.find(draft, x => x.Id == newTask.Id);
                                                                    if (!theTask) return;
                                                                    if (!theTask.CurrentTransStatus) return;

                                                                    theTask.PreviousTransStatus = {
                                                                        //前次紀錄的下載Size
                                                                        ProcessedSize: theTask.CurrentTransStatus.ProcessedSize,
                                                                        //前次紀錄的時間
                                                                        TriggerTime: theTask.CurrentTransStatus.TriggerTime
                                                                    };

                                                                    theTask.CurrentTransStatus = {
                                                                        //目前下載的Size
                                                                        ProcessedSize: offset,
                                                                        //當下的時間
                                                                        TriggerTime: new Date()
                                                                    };

                                                                    /**  Calculate the time difference  **/
                                                                    const dateCurrent = dayjs(theTask.CurrentTransStatus.TriggerTime);
                                                                    const datePrevious = dayjs(theTask.PreviousTransStatus.TriggerTime);
                                                                    //The miminal observation interval is 1 second
                                                                    const diffSeconds = dateCurrent.diff(datePrevious, 'second') || 1;

                                                                    /**  Calculate the size difference  **/
                                                                    const sizeCurrent = theTask.CurrentTransStatus.ProcessedSize;
                                                                    const sizePrevious = theTask.PreviousTransStatus.ProcessedSize;
                                                                    const diffSize = sizeCurrent - sizePrevious!;

                                                                    /** Generate the humanlike data transfer information **/
                                                                    const transferRate = Math.ceil(diffSize / diffSeconds);
                                                                    const hmlSize = genHumanlikeSizeDesc(theTask.CurrentTransStatus.ProcessedSize);
                                                                    const hmlRate = genHumanlikeSizeDesc(transferRate);
                                                                    theTask.TotalSize = `${hmlSize.Size} ${hmlSize.Unit}`;
                                                                    theTask.TransferRate = `${hmlRate.Size} ${hmlRate.Unit}`;

                                                                    console.log(`[${theTask.Action}] File name: "${theTask.FileName}", Total Size: ${theTask.TotalSize}, Transfer Rate: ${theTask.TransferRate}`);
                                                                });
                                                            }, 1000, { trailing: true });

                                                            blobWriter.onerror = (_blob, _offset, error) => {
                                                                //Close stream
                                                                blobWriter.sendEnd();

                                                                //Promise reject
                                                                reject(error);

                                                                modalHintRef.current?.setContentPanel(
                                                                    <Typography variant="h6" gutterBottom>
                                                                        {`${file.name} uploaded failed! message: ${error.message}`}
                                                                    </Typography>
                                                                )
                                                                modalHintRef.current?.setOpen(true);
                                                            }

                                                            blobWriter.oncomplete = (_blob) => {
                                                                //Close stream
                                                                blobWriter.sendEnd();

                                                                //Promise resolve
                                                                resolve("Success");
                                                            }

                                                            blobWriter.sendBlob(blob);
                                                        }
                                                    });
                                                }
                                            };
                                            return newTask;
                                        };
                                        promises.push(runAsync());
                                    });

                                    //When all tasks ready, populating them to the task queue
                                    Promise.all(promises)
                                        .then(tasks => {
                                            setUploadTasks(draft => {
                                                //Clear all tasks from upload task queue
                                                draft.length = 0;

                                                //Push elements
                                                draft.push(...tasks);

                                                setIsUploading(true);
                                                refFileExplorer.current?.setUploadEnabled(false);
                                                refFileExplorer.current?.setUploadProgress(0);
                                                refFileExplorer.current?.setUploadBadgeCount(filePathes.length);
                                            });
                                        });
                                }}
                                ref={refFileExplorer} />
                        </CustomizedDialog>
                        <CustomizedDialog
                            title="Warning"
                            autoClose={1000}
                            open={false}
                            ref={modalHintRef} >
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
                                            refFileSystem.current?.requestInputStream('/', (inStream, mimeType) => {
                                                onBody({
                                                    inStream: inStream,
                                                    mimeType: mimeType,
                                                    path: '/'
                                                });
                                            });
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