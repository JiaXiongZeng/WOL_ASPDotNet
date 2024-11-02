import { useState, useEffect } from 'react';


import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Badge from '@mui/material/Badge';

import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';


import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';


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

const renderBreadcrumbs = (path: string[], handlePathChange: (f: string) => void) => {
    const breadcrumbLinks = path.map((folder, index) => {
        const isLast = index === path.length - 1;
        const link = isLast ? (
            <Typography key={index} color="text.primary">{folder}</Typography>
        ) : (
            <Link
                key={index}
                color="inherit"
                onClick={() => handlePathChange(folder)}
                style={{ cursor: 'pointer' }}
            >
                {folder}
            </Link>
        );
        return link;
    });

    return (
        <Breadcrumbs maxItems={4} itemsBeforeCollapse={0} itemsAfterCollapse={4}
            sx={{
                '& .MuiBreadcrumbs-separator': {
                    marginLeft: '2px',
                    marginRight: '2px'
                },
                paddingLeft: '8px',
                paddingRight: '8px'
            }} >
            {breadcrumbLinks}
        </Breadcrumbs>
    );
};

export const FileExplorer = () => {
    const transferPanelHeight = 30;
    const [localPath, setLocalPath] = useState(['Local']);
    const [remotePath, setRemotePath] = useState(['Remote']);

    const [upProgress, setUpProgress] = useState(10);




    const handleLocalPathChange = (newPath: string) => {
        setLocalPath([...localPath, newPath]);
    };

    const handleRemotePathChange = (newPath: string) => {
        setRemotePath([...remotePath, newPath]);
    };

    const handleUpload = () => {
        console.log("Upload initiated!");
    };

    const handleDownload = () => {
        console.log("Download initiated!");
    };


    useEffect(() => {
        const timer = setInterval(() => {
            setUpProgress((prevProgress) => (prevProgress >= 100 ? 10 : prevProgress + 10));
        }, 800);
        return () => {
            clearInterval(timer);
        };
    }, []);



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
                        {renderBreadcrumbs(localPath, handleLocalPathChange)}
                        <SimpleTreeView sx={{ height: `${transferPanelHeight}vh`, maxHeight: `${transferPanelHeight}vh`, overflow: 'auto' }}>
                            <TreeItem itemId="1" label="Folder A">
                                <TreeItem itemId="2" label="Subfolder A1" onClick={() => handleLocalPathChange('Subfolder A1')} />
                                <TreeItem itemId="3" label="Subfolder A2" onClick={() => handleLocalPathChange('Subfolder A2')} />
                            </TreeItem>
                            <TreeItem itemId="4" label="Folder B">
                                <TreeItem itemId="5" label="File B1.txt" />
                            </TreeItem>
                            <TreeItem itemId="6" label="Folder C">
                                <TreeItem itemId="7" label="File C1.txt" />
                                <TreeItem itemId="6-1" label="Folder C-1">
                                    <TreeItem itemId="6-1-1" label="File C-1-1.txt" />
                                </TreeItem>
                            </TreeItem>
                            <TreeItem itemId="8" label="Folder D">
                                <TreeItem itemId="9" label="File D1.txt" />
                            </TreeItem>
                        </SimpleTreeView>
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
                        {renderBreadcrumbs(remotePath, handleRemotePathChange)}
                        <SimpleTreeView sx={{ height: `${transferPanelHeight}vh`, maxHeight: `${transferPanelHeight}vh`, overflow: 'auto' }}>
                            <TreeItem itemId="6" label="Folder C">
                                <TreeItem itemId="7" label="Subfolder C1" onClick={() => handleRemotePathChange('Subfolder C1')} />
                                <TreeItem itemId="8" label="Subfolder C2" onClick={() => handleRemotePathChange('Subfolder C2')} />
                            </TreeItem>
                            <TreeItem itemId="9" label="Folder D">
                                <TreeItem itemId="10" label="File D1.txt" />
                            </TreeItem>
                        </SimpleTreeView>
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
                        <LinearProgressWithLabel value={upProgress} />
                    </Grid>
                </Grid>
            </Stack>
        </>
    );
};

export default FileExplorer;