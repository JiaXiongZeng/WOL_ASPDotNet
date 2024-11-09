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

import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { TreeViewBaseItem } from '@mui/x-tree-view/models';

import { FileRichSelector, ExtendedTreeItemProps, FileRichSelectorRef, FileType, ItemInfo } from '@components/FileRichSelector';
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
        ext = fileName.substring(lastIdxOfDot + 1, fileName.length - 1);
    } else {
        if (fileName.includes(':')) {
            ext = fileName;
        }
    }
    return ext;
}

export const judgeFileType = (ext: string, isFolder: boolean): FileType => {
    let result: FileType  = 'others';

    if (ext.includes(':') || ext.includes('/')) {
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

export interface FileExplorerProps {
    localFsRootName: string,
    remoteFsRootName: string,
    onRemoteItemToggled?: (itemInfo: ItemInfo) => void,
    onLocalItemToggled?: (itemInfo: ItemInfo) => void
}

export type FileExplorerRef = {
    renewLocalFsNodes: (rowFilePathes: Record<string, string>) => void,
    renewRemoteFsNodes: (rowFilePathes: Record<string, string>) => void,
    getLocalFsNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[],
    getRemoteFsNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[]
}

export const FileExplorer = forwardRef<FileExplorerRef, FileExplorerProps>((props, ref) => {
    const transferPanelHeight = 30;
    const { localFsRootName, remoteFsRootName, onLocalItemToggled, onRemoteItemToggled } = props;

    const refLocalFileExplorer = useRef<FileRichSelectorRef>(null);
    const refRemoteFileExporer = useRef<FileRichSelectorRef>(null);


    //Root Pathes
    const [localPath, setLocalPath] = useState(localFsRootName);
    const [remotePath, setRemotePath] = useState(remoteFsRootName);

    //Data Transfer Progress
    const [upProgress, setUpProgress] = useState(10);
    const [downProgress, setDownProgress] = useState(10);

    const [localFsNodes, setLocalFsNodes] = useImmer<TreeViewBaseItem<ExtendedTreeItemProps>[]>([]);
    const [remoteFsNodes, setRemoteFsNodes] = useImmer<TreeViewBaseItem<ExtendedTreeItemProps>[]>([]);


    const loadLocalFileSystemNodes = () => {
        const result: TreeViewBaseItem<ExtendedTreeItemProps>[] = [
            {
                id: '1',
                label: 'Documents',
                children: [
                    {
                        id: '1.1',
                        label: 'Company',
                        children: [
                            { id: '1.1.1', label: 'Invoice', fileType: 'pdf' },
                            { id: '1.1.2', label: 'Meeting notes', fileType: 'doc' },
                            { id: '1.1.3', label: 'Tasks list', fileType: 'doc' },
                            { id: '1.1.4', label: 'Equipment', fileType: 'pdf' },
                            { id: '1.1.5', label: 'Video conference', fileType: 'video' },
                        ],
                    },
                    { id: '1.2', label: 'Personal', fileType: 'folder' },
                    { id: '1.3', label: 'Group photo', fileType: 'image' },
                ],
            },
            {
                id: '2',
                label: 'Bookmarked',
                fileType: 'pinned',
                children: [
                    { id: '2.1', label: 'Learning materials', fileType: 'folder' },
                    {
                        id: '2.2',
                        label: 'News',
                        fileType: 'folder',
                        children: [
                            { id: '2.2.1', label: 'Invoice', fileType: 'others' },
                            { id: '2.2.2', label: 'Meeting notes', fileType: 'others' },
                            { id: '2.2.3', label: 'Tasks list', fileType: 'doc' },
                            { id: '2.2.4', label: 'Equipment', fileType: 'pdf' },
                            { id: '2.2.5', label: 'Video conference', fileType: 'video' },
                        ]
                    },
                    { id: '2.3', label: 'Forums', fileType: 'folder' },
                    { id: '2.4', label: 'Travel documents', fileType: 'pdf' },
                ],
            },
            { id: '3', label: 'History', fileType: 'folder' },
            { id: '4', label: 'Trash', fileType: 'trash' },
        ];

        return result;
    }

    const loadRemoteFileSystemNodes = () => {
        const result: TreeViewBaseItem<ExtendedTreeItemProps>[] = [
            //{
            //    id: '/',
            //    label: '/',
            //    fileType: 'storage'
            //}
        ];

        return result;
    }

    const handleUpload = () => {
        console.log("Upload initiated!");
    };

    const handleDownload = () => {
        console.log("Download initiated!");
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


    //Initialization
    useEffect(() => {
        //Load default file system tree from local host
        const localNodes = loadLocalFileSystemNodes();
        setLocalFsNodes(localNodes);

        //Load default file system tree from remote host
        const remoteNodes = loadRemoteFileSystemNodes();
        setRemoteFsNodes(remoteNodes);
    }, []);

    useImperativeHandle(ref, () => ({
        renewLocalFsNodes: (_rowFilePathes: Record<string, string>) => {

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
                                <IconButton>
                                    <CreateNewFolderIcon />
                                </IconButton>
                                <IconButton>
                                    <DriveFileMoveIcon />
                                </IconButton>
                                <IconButton>
                                    <DeleteForeverIcon />
                                </IconButton>
                            </Box>
                        </Box>
                        <FileBreadcrumbs path={localPath} handlePathChange={(_e, _newPath) => {
                            //console.log(newPath);
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
                                <IconButton>
                                    <CreateNewFolderIcon />
                                </IconButton>
                                <IconButton>
                                    <DriveFileMoveIcon />
                                </IconButton>
                                <IconButton>
                                    <DeleteForeverIcon />
                                </IconButton>
                            </Box>
                        </Box>                        
                        <FileBreadcrumbs path={remotePath} handlePathChange={(e, newPath) => {
                            //console.log(newPath);
                            refRemoteFileExporer.current?.setItemFocused(e, newPath);

                            //Scroll to the clicked item
                            setTimeout(() => {
                                const currentItemDOM = refRemoteFileExporer.current?.getFocusedItemDOM(newPath);
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
                            ref={refRemoteFileExporer}
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