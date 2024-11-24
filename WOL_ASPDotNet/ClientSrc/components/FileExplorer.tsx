import {
    useState, useEffect, useRef,
    forwardRef, useImperativeHandle
} from 'react';

import { useImmer } from 'use-immer';

import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Badge from '@mui/material/Badge';

import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import RefreshIcon from '@mui/icons-material/Refresh';

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { TreeViewBaseItem } from '@mui/x-tree-view/models';

import { FileRichSelector, ExtendedTreeItemProps, FileRichSelectorHandler, FileType, ItemInfo } from '@components/FileRichSelector';
import { FileBreadcrumbs } from '@components/FileBreadcumbs';

import * as lodash from 'lodash';
import '@extensions/ExtTreeViewBaseItem.d';
import { SwitchCase, conditionObj } from '@utilities/SwitchCaseUtility';


const RectIconButton = styled(IconButton)(() => ({
    borderRadius: 0,
    /*paddingLeft: "1em",
    paddingRight: "1em"*/
}));

const LinearProgressWithLabel = (props: LinearProgressProps & { value: number }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                >{`${Math.round(props.value)}%`}</Typography>
            </Box>
        </Box>
    );
}

export const getFileExt = (fileName: string) => {
    const lastIdxOfDot = fileName.lastIndexOf('.');
    let ext = "";
    if (lastIdxOfDot != -1) {
        ext = fileName.substring(lastIdxOfDot + 1);
    } else {
        if (fileName.includes(':') || fileName == '/') {
            ext = fileName;
        }
    }
    return ext;
}

export const judgeFileType = (ext: string, isFolder: boolean): FileType => {
    let result: FileType  = 'others';

    if (ext.includes(':') || ext == '/') {
        result = 'storage';
        return result;
    }

    if (isFolder) {
        result = 'folder';
        return result;
    }

    result = SwitchCase(() => {
        const imagePredicate = (): FileType => 'image';
        const result: conditionObj<string, FileType> = {
            cases: {
                'pdf': () => 'pdf',
                'doc': () => 'doc',
                'folder': () => 'folder',
                'jpg': imagePredicate,
                'jpeg': imagePredicate,
                'gif': imagePredicate,
                'png': imagePredicate,
                'bmp': imagePredicate,
                'svg': imagePredicate
            },
            defaultCase: () => 'others'
        }
        return result;
    })(ext);

    return result;
}

export type LocalFsNodeType = {
    isFolder: boolean
};

export interface FileExplorerProps {
    localFsRootName: string,
    remoteFsRootName: string,
    onRemoteItemToggled?: (itemInfo: ItemInfo) => void,
    onRemoteRefresh?: () => void,
    onLocalItemToggled?: (itemInfo: ItemInfo) => void,
    onLocalRefresh?: () => void,
    onDownload?: (filePathes: string[]) => void,
    onUpload?: (filePathes: string[]) => void
}

export type FileExplorerHandler = {
    renewLocalFsNodes: (rowFilePathes: Record<string, LocalFsNodeType>) => void,
    renewRemoteFsNodes: (rowFilePathes: Record<string, string>) => void,
    getLocalFsNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[],
    getRemoteFsNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[],
    getLocalSelectedNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[],
    getLocalSelectedFolderNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[],
    getRemoteSelectedNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[],
    getRemoteSelectedFolderNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[]
}

export const FileExplorer = forwardRef<FileExplorerHandler, FileExplorerProps>((props, ref) => {
    const transferPanelHeight = 30;
    const {
        localFsRootName, remoteFsRootName,
        onLocalItemToggled, onLocalRefresh,
        onRemoteItemToggled, onRemoteRefresh,
        onDownload, onUpload
    } = props;
    
    const refLocalFileExplorer = useRef<FileRichSelectorHandler>(null);
    const refRemoteFileExplorer = useRef<FileRichSelectorHandler>(null);


    //Root Pathes
    const [localPath, setLocalPath] = useState(localFsRootName);
    const [remotePath, setRemotePath] = useState(remoteFsRootName);

    //Data Transfer Progress
    const [upProgress, setUpProgress] = useState(10);
    const [downProgress, setDownProgress] = useState(10);

    const [localFsNodes, setLocalFsNodes] = useImmer<TreeViewBaseItem<ExtendedTreeItemProps>[]>([]);
    const [remoteFsNodes, setRemoteFsNodes] = useImmer<TreeViewBaseItem<ExtendedTreeItemProps>[]>([]);


    const handleUpload = () => {
        const filePathes = refLocalFileExplorer.current?.getSelectedFilePathes();
        onUpload && onUpload(filePathes || []);

        //Remember to update LinearProgressWithLabel
    };

    const handleDownload = () => {
        const filePathes = refRemoteFileExplorer.current?.getSelectedFilePathes();
        onDownload && onDownload(filePathes || []);

        //Remember to update LinearProgressWithLabel
    };


    useEffect(() => {
        const timer = setInterval(() => {
            setUpProgress((prevProgress) => (prevProgress >= 100 ? 10 : prevProgress + 10));
            setDownProgress((prevProgress) => (prevProgress >= 100 ? 10 : prevProgress + 10));
        }, 800);
        return () => {
            clearInterval(timer);
        };
    }, []);


    useImperativeHandle(ref, () => ({
        renewLocalFsNodes: (rowFilePathes: Record<string, LocalFsNodeType>) => {
            lodash.forEach(rowFilePathes, (metaType, path) => {
                const tokens = path.split('/');
                const fileName = lodash.last(tokens)! || '/';
                const parentPath = '/' + lodash.trimStart(path.substring(0, path.length - fileName.length - 1), '/');
                const isFolder = metaType.isFolder;

                //Expand the nodes retrived from remote host
                setLocalFsNodes(draft => {
                    const findNodes = draft.findItemsByIds([path]);
                    if (findNodes.length == 0) {
                        const parentNodes = draft.findItemsByIds([parentPath]);
                        if (parentNodes.length == 0) {
                            //Create new node under root node
                            draft.push({
                                id: path,
                                label: fileName,
                                fileType: judgeFileType(getFileExt(fileName), isFolder)
                            });
                        } else {
                            //Create new node under specific parent node
                            const theParentNode = parentNodes[0];
                            if (!theParentNode.children) {
                                theParentNode.children = [];
                            }

                            const isExist = lodash.some(theParentNode.children, x => x.id == path);
                            if (!isExist) {
                                theParentNode.children.push({
                                    id: path,
                                    label: fileName,
                                    fileType: judgeFileType(getFileExt(fileName), isFolder)
                                });
                            }
                        }
                    }
                });
            });
        },
        renewRemoteFsNodes: (rowFilePathes: Record<string, string>) => {
            lodash.forEach(rowFilePathes, (metaType, path) => {
                const tokens = path.split('/');
                const fileName = lodash.last(tokens)!;
                const parentPath = path.substring(0, path.length - fileName.length - 1);
                const isFolder = (metaType.indexOf('stream-index+json') != -1);

                //Expand the nodes retrived from remote host
                setRemoteFsNodes(draft => {
                    const findNodes = draft.findItemsByIds([path]);
                    if (findNodes.length == 0) {                        
                        const parentNodes = draft.findItemsByIds([parentPath]);
                        if (parentNodes.length == 0) {
                            //Create new node under root node
                            draft.push({
                                id: path,
                                label: fileName,
                                fileType: judgeFileType(getFileExt(fileName), isFolder)
                            });
                        } else {
                            //Create new node under specific parent node
                            const theParentNode = parentNodes[0];
                            if (!theParentNode.children) {
                                theParentNode.children = [];
                            }

                            const isExist = lodash.some(theParentNode.children, x => x.id == path);
                            if (!isExist) {
                                theParentNode.children.push({
                                    id: path,
                                    label: fileName,
                                    fileType: judgeFileType(getFileExt(fileName), isFolder)
                                });
                            }
                        }
                    }
                });
            });
        },
        getLocalFsNodes: () => {
            return localFsNodes;
        },
        getRemoteFsNodes: () => {
            return remoteFsNodes;
        },
        getLocalSelectedNodes: () => {
            return refLocalFileExplorer.current?.getSelectedNodes() || [];
        },
        getLocalSelectedFolderNodes: () => {
            return refLocalFileExplorer.current?.getSelectedFolderNodes() || [];
        },
        getRemoteSelectedNodes: () => {
            return refRemoteFileExplorer.current?.getSelectedNodes() || [];
        },
        getRemoteSelectedFolderNodes: () => {
            return refRemoteFileExplorer.current?.getSelectedFolderNodes() || [];
        }
    }), [ localFsNodes, remoteFsNodes ]);

    return (
        <>
            <Grid container spacing={1} sx={{ flexGrow: "0" }}  >
                {/* Local Host Column */}
                <Grid item xs={5.5} sx={{ padding:"8px" }} >                    
                    <Paper elevation={3} style={{ padding: '5px'/*, height: `calc(${(transferPanelHeight)}vh + 120px)`*/ }}>
                        <Box sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingLeft: "8px",
                            paddingRight: "8px"
                        }}>
                            <Typography variant="h6">Local Host</Typography>
                            <Box>
                                <Tooltip arrow placement="top-start" title="Mount local visible folder">
                                    <IconButton onClick={async () => {
                                        //Initialize the local file system nodes
                                        refLocalFileExplorer.current?.resetAll();
                                        setLocalFsNodes([]);
                                        setLocalPath('/');

                                        //Refresh new pathes
                                        onLocalRefresh && onLocalRefresh();
                                    }}>
                                        <FolderOpenIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        <FileBreadcrumbs path={localPath} handlePathChange={(e, newPath) => {
                            refLocalFileExplorer.current?.setItemFocused(e, newPath);

                            //Scroll to the clicked item
                            setTimeout(() => {
                                const currentItemDOM = refLocalFileExplorer.current?.getFocusedItemDOM(newPath);
                                currentItemDOM?.scrollIntoView({ behavior: "smooth" });
                            }, 200);
                        }} />
                        <FileRichSelector
                            nodes={localFsNodes}
                            onItemToggled={(itemInfo) => {
                                onLocalItemToggled && onLocalItemToggled(itemInfo);

                                //Response to the breadcrumbs against to the RichFileSelector
                                setLocalPath(itemInfo.path);
                            }}
                            ref={refLocalFileExplorer}
                            sx={{ height: `${transferPanelHeight}vh`, maxHeight: `${transferPanelHeight}vh`, overflow: 'auto' }} />
                    </Paper>
                </Grid>

                {/* Middle Sync Panel */ }
                <Grid container xs={1} >
                    <Stack sx={{ flexGrow: "1", alignCenter: "center", justifyContent: "center" }} >
                        <Tooltip arrow  placement="top" title="Upload files" >
                            <RectIconButton color="default" onClick={handleUpload} >
                                <KeyboardDoubleArrowRightIcon />
                            </RectIconButton>
                        </Tooltip>
                        <Tooltip arrow placement="bottom" title="Download files">
                            <RectIconButton color="default" onClick={handleDownload} >
                                <KeyboardDoubleArrowLeftIcon />
                            </RectIconButton>
                        </Tooltip>
                    </Stack>
                </Grid>

                {/* Remote Host Column */}
                <Grid item xs={5.5} sx={{ padding: "8px" }} >                    
                    <Paper elevation={3} style={{ padding: '5px'/*, height: `calc(${(transferPanelHeight)}vh + 120px)`*/ }}>
                        <Box sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingLeft: "8px",
                            paddingRight: "8px"
                        }}>
                            <Typography variant="h6">Remote Host</Typography>
                            <Box>
                                <Tooltip arrow placement="top-start" title="Reload remote file system">
                                    <IconButton onClick={() => {
                                        //Initialize the remote file system nodes
                                        refRemoteFileExplorer.current?.resetAll();
                                        setRemoteFsNodes([]);
                                        setRemotePath('/');

                                        //Refresh new pathes
                                        onRemoteRefresh && onRemoteRefresh();
                                    }}>
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>                        
                        <FileBreadcrumbs path={remotePath} handlePathChange={(e, newPath) => {
                            //console.log(newPath);
                            refRemoteFileExplorer.current?.setItemFocused(e, newPath);

                            //Scroll to the clicked item
                            setTimeout(() => {
                                const currentItemDOM = refRemoteFileExplorer.current?.getFocusedItemDOM(newPath);
                                currentItemDOM?.scrollIntoView({ behavior: "smooth" });
                            }, 200);
                        }} />
                        <FileRichSelector
                            nodes={remoteFsNodes}
                            onItemToggled={(itemInfo) => {                                
                                onRemoteItemToggled && onRemoteItemToggled(itemInfo);

                                //Response to the breadcrumbs against to the RichFileSelector
                                setRemotePath(itemInfo.path);
                            }}
                            ref={refRemoteFileExplorer}
                            sx={{ height: `${transferPanelHeight}vh`, maxHeight: `${transferPanelHeight}vh`, overflow: 'auto' }} />
                    </Paper>
                </Grid>
            </Grid>
            <Stack sx={{ marginTop: "1em" }} spacing={1} >
                <Grid container spacing={1} >
                    <Grid item xs={3} sx={{ display: "flex", justifyContent: "space-between", paddingRight: "8px" }} >
                        <Typography component="span" >Upload Process</Typography>
                        <Stack spacing={2} direction="row" sx={{ display: "inline-flex" }} >
                            <Badge badgeContent={4} color="primary">
                                <FileUploadIcon color="action" />
                            </Badge>
                        </Stack>
                    </Grid>
                    <Grid item xs={9} >
                        <LinearProgressWithLabel value={upProgress} />
                    </Grid>
                </Grid>
                <Grid container spacing={1} >
                    <Grid item xs={3} sx={{ display: "flex", justifyContent: "space-between", paddingRight: "8px" }} >
                        <Typography component="span" >Download Process</Typography>
                        <Stack spacing={2} direction="row" sx={{ display: "inline-flex" }} >
                            <Badge badgeContent={4} color="primary">
                                <FileDownloadIcon color="action" />
                            </Badge>
                        </Stack>
                    </Grid>
                    <Grid item xs={9} >
                        <LinearProgressWithLabel value={downProgress} />
                    </Grid>
                </Grid>
            </Stack>
        </>
    );
});

export default FileExplorer;