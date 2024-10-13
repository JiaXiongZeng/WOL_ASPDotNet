import {
    useEffect, useState, useCallback,
    forwardRef, useImperativeHandle, ReactNode
} from 'react';

import { Breakpoint, styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Typography } from '@mui/material';


const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
    '& .MuiDialogTitle-root': {
        minWidth: "300px !important"
    }
}));

export type DialogMinHeight = '100vh' | '90vh' | '80vh' | '70vh' | '60vh' | '50vh' | '40vh' | '30vh' | 'auto' | string;

export interface CustomizedDialogProp {
    open: boolean,
    autoClose: Nullable<number>,
    title: Nullable<string>
    showClose: Nullable<boolean>
    actionPanel: Nullable<ReactNode>
    children: Nullable<ReactNode>
    onClose: () => void
    fullWidth?: boolean
    maxWidth?: Breakpoint | false;
    minHeight?: DialogMinHeight

}

export type CustomizedDialogHandler = {
    setOpen: (isOpen: boolean) => void,
    setContentPanel: (node: Nullable<ReactNode>) => void,
    setActionPanel: (node: Nullable<ReactNode>) => void,
    setFullWidth: (isFullWidth?: boolean) => void,
    setMaxWidth: (maxWidth?: Breakpoint | false) => void,
    setMinHeight: (minHeight?: DialogMinHeight) => void
}

const CustomizedDialog = forwardRef<CustomizedDialogHandler, Partial<CustomizedDialogProp>>((props, ref) => {
    const [isInit, setIsInit] = useState(true);
    const [open, setOpen] = useState(props.open);
    const [autoClose, setAutoClose] = useState(props.autoClose);
    const [content, setContent] = useState(props.children);
    const [actionPanel, setActionPanel] = useState(props.actionPanel);
    const [fullWidth, setFullWidth] = useState(props.fullWidth);
    const [maxWidth, setMaxWidth] = useState(props.maxWidth);
    const [minHeight, setMinHeight] = useState(props.minHeight);

    useEffect(() => {
        setIsInit(false);
    }, []);

    useEffect(() => {
        if (!isInit) {
            if (!open && props.onClose) {
                props.onClose();
            }            
        }
    }, [open]);

    const handleClose = () => {
        setOpen(false);
    };

    const BodyComponent = useCallback(() => {
        return content;
    }, [content]);

    useImperativeHandle(ref, () => {
        return {
            setOpen: (isOpen: boolean) => {
                setOpen(isOpen);
            },
            setAutoClose: (timeOut: number) => {
                setAutoClose(timeOut);
            },
            setContentPanel: (node: Nullable<ReactNode>) => {
                setContent(node);
            },
            setActionPanel: (node: Nullable<ReactNode>) => {
                setActionPanel(node);
            },
            setFullWidth: (isFullWidth?: boolean) => {
                setFullWidth(isFullWidth);
            },
            setMaxWidth: (maxWidth?: Breakpoint | false) => {
                setMaxWidth(maxWidth);
            },
            setMinHeight: (minHeight?: DialogMinHeight) => {
                setMinHeight(minHeight);
            }
        };
    }, []);

    const animationProps = {
        closeAfterTransition: true,
        transitionDuration: {
            enter: 1000,
            appear: 2000,
            exit: 2000
        },
        onTransitionEnd: () => {
            //User set the autoClose count down feature on
            if (Number.isInteger(autoClose)) {
                setTimeout(() => {
                    setOpen(false);
                }, autoClose!);
            }
        }        
    }

    const paperStyleProps = {
        PaperProps: {
            sx: {
                minHeight: minHeight
            }
        }
    }

    return (
        <>
            <BootstrapDialog
                open={open!}
                //To avoid the screen twinkling, make the window has given height
                {...paperStyleProps}
                disableEscapeKeyDown={true}
                {...(Number.isInteger(autoClose) && animationProps)}
                fullWidth={fullWidth}
                maxWidth={maxWidth}
            >
                <DialogTitle sx={{ m: 0, p: 1.7 }} >
                    <Typography sx={{ fontSize: "1em" }}>
                        {props.title ?? "Information"}
                    </Typography>
                </DialogTitle>
                {
                    props.showClose &&
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                }
                <DialogContent dividers
                    sx={
                        //Make the elements inside the dialog content part can occupy the full placehold
                        {
                            flex: (minHeight == "auto" || !minHeight ? "1 1 auto": "1 1 0"),
                            display: "flex",
                            flexFlow: "column",
                            //Style Expression
                            //CSS Filter is followed after ampersand sign
                            '& > *': {
                                flex: "1 1 0"
                            }
                        }
                    }
                >
                    <BodyComponent />
                </DialogContent>
                {
                    actionPanel &&
                    <DialogActions>
                        {actionPanel}
                    </DialogActions>
                }                
            </BootstrapDialog>
        </>
    );
});

export default CustomizedDialog;