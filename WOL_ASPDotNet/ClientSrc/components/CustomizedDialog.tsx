import {
    useEffect, useState, useCallback, useRef,
    forwardRef, useImperativeHandle, ReactNode
} from 'react';

import { Breakpoint, styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import { Typography } from '@mui/material';
import { useDrag, useDrop } from 'react-dnd';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import Tooltip from '@mui/material/Tooltip';
import ExpandIcon from '@mui/icons-material/Expand';
import { animated } from '@react-spring/web';


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
    showMinimize?: Nullable<boolean>,
    actionPanel: Nullable<ReactNode>
    children: Nullable<ReactNode>
    onClose: () => void
    fullWidth?: boolean
    maxWidth?: Breakpoint | false;
    minHeight?: DialogMinHeight
    dragable?: Nullable<boolean>
}

export type CustomizedDialogHandler = {
    setOpen: (isOpen: boolean) => void,
    setDraggable: (isDraggable: boolean) => void,
    setContentPanel: (node: Nullable<ReactNode>) => void,
    setActionPanel: (node: Nullable<ReactNode>) => void,
    setFullWidth: (isFullWidth?: boolean) => void,
    setMaxWidth: (maxWidth?: Breakpoint | false) => void,
    setMinHeight: (minHeight?: DialogMinHeight) => void
}

// Type for position
interface Position {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
}

const CustomizedDialog = forwardRef<CustomizedDialogHandler, Partial<CustomizedDialogProp>>((props, ref) => {
    const [isInit, setIsInit] = useState(true);
    const [open, setOpen] = useState(props.open);
    const [minimize, setMinimize] = useState(false);
    const [autoClose, setAutoClose] = useState(props.autoClose);
    const [content, setContent] = useState(props.children);
    const [actionPanel, setActionPanel] = useState(props.actionPanel);
    const [fullWidth, setFullWidth] = useState(props.fullWidth);
    const [maxWidth, setMaxWidth] = useState(props.maxWidth);
    const [minHeight, setMinHeight] = useState(props.minHeight);

    const [draggable, setDraggable] = useState(props.dragable || false);
    const [positionDialog, setPositionDialog] = useState<Position>({ top: 0, left: 0 });
    const [positionSpeedDial, setPositionSpeedDial] = useState<Position>({ right: 40, bottom: 40 });

    const refDialog = useRef<Nullable<HTMLDivElement>>(null);
    const refDiaTitle = useRef<Nullable<HTMLSpanElement>>(null);
    const refSpeedDialWrapper = useRef<Nullable<HTMLDivElement>>(null);

    useEffect(() => {
        setIsInit(false);
    }, []);

    useEffect(() => {
        if (!isInit) {
            if (!open && props.onClose) {
                props.onClose();
            }

            if(draggable && open) {
                const initialPos = calculateInitialPosition();
                setPositionDialog(initialPos);
            }
        }
    }, [open, draggable, refDialog.current]);

    const handleClose = () => {
        setOpen(false);
    };

    const toggleMinimize = () => {
        setMinimize(!minimize);
    }

    const BodyComponent = useCallback(() => {
        return content;
    }, [content]);


    // Drag setup for Dialog
    const [{ isDragging /*, clientOffset*/ }, drag, _preview] = useDrag(() => ({
        type: 'DRAGGABLE_DIALOG',  // Match the type of draggable item
        item: (_monitor) => {
            //可以設定成任何想要在後面Callback中使用的item
            return { type: 'DRAGGABLE_DIALOG', id: refDialog.current?.id, ref: refDialog.current };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
            /*clientOffset: monitor.getClientOffset()*/
        })
    }), [positionDialog, refDialog.current]);

    // Drag setup for SpeedDial
    const [{ isDraggingSD }, dragSD, _previewSD] = useDrag(() => ({
        type: 'DRAGGABLE_SPEED_DIAL',
        item: (monitor) => {
            //Because the initial position of SpeedDial is located by CSS bottom/right,
            //It's necessary to get the intial client offset for top/left from monitor utility
            const initialOffset = monitor.getInitialSourceClientOffset();
            setPositionSpeedDial({
                top: initialOffset?.y,
                left: initialOffset?.x
            });

            //可以設定成任何想要在後面Callback中使用的item
            return { type: 'DRAGGABLE_SPEED_DIAL' };
        },
        collect: (monitor) => ({
            isDraggingSD: monitor.isDragging(),
        })
    }), [positionSpeedDial]);

    // Drag-and-drop setup
    const [, drop] = useDrop(() => ({
        accept: ['DRAGGABLE_DIALOG', 'DRAGGABLE_SPEED_DIAL'],  // Match the type of draggable items
        drop: (item: any, monitor) => {
            const delta = monitor.getDifferenceFromInitialOffset();
            if (delta) {
                if (item.type == 'DRAGGABLE_SPEED_DIAL') {
                    setPositionSpeedDial({
                        top: positionSpeedDial.top! + delta.y,
                        left: positionSpeedDial.left! + delta.x
                    });
                } else {
                    setPositionDialog({
                        top: positionDialog.top! + delta.y,
                        left: positionDialog.left! + delta.x
                    });
                }
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(), // Track if the item is over the drop target
            canDrop: monitor.canDrop(), // Track if the drop is allowed
        }),
    }), [positionDialog, positionSpeedDial]);

    // Calculate the initial centered position based on window size & dialog size
    const calculateInitialPosition = (): Position => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const dialogWidth = refDialog.current?.clientWidth || windowWidth;
        const dialogHeight = refDialog.current?.clientHeight || windowHeight;

        return {
            top: (windowHeight - dialogHeight) / 2,
            left: (windowWidth - dialogWidth) / 2,
        };
    };

    useImperativeHandle(ref, () => {
        return {
            setOpen: (isOpen: boolean) => {
                setOpen(isOpen);
            },
            setDraggable: (isDraggable: boolean) => {
                setDraggable(isDraggable);
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
                PaperProps={
                    draggable ?
                        {
                            sx: {
                                ...paperStyleProps.PaperProps.sx,
                                position: 'absolute',
                                top: positionDialog.top,
                                left: positionDialog.left,
                                opacity: isDragging ? 0.5 : 1,
                                //當縮小時讓背後的項目可以被操作
                                pointerEvents: (minimize ? 'auto' : undefined),
                                visibility: (minimize ? 'hidden' : undefined)
                            },
                            ref: (elem: HTMLDivElement) => {
                                //drag(elem);
                                refDialog.current = elem;
                            }
                        }
                        :
                        {
                            ...paperStyleProps.PaperProps
                        }
                }
                hideBackdrop={minimize}
                disableEnforceFocus={minimize}
                //Avoid aria-hidden block error
                closeAfterTransition={false}
                componentsProps={
                    {
                        //讓整個dialog可以被drop在MUI Dialog root或body的任何地方
                        root: {
                            ref: (elem: HTMLDivElement) => {
                                if (minimize) {
                                    //因為要取座標，如果drop handler的element不見會取不到而報錯
                                    drop(document.body);
                                } else {
                                    drop(elem);
                                }
                                
                            }
                        }
                    }
                }
                style={{
                    //當縮小時讓背後的項目可以被操作
                    pointerEvents: (minimize ? 'none' : undefined)
                }}
            >
                <DialogTitle 
                    ref={(elem) => {
                        if (draggable) {
                            drag(elem);
                            refDiaTitle.current = elem;
                        }
                    }}
                    sx={{ m: 0, p: 1.7, cursor: draggable ? 'move' : 'default' }}
                >
                    <Typography sx={{ fontSize: "1em" }}>
                        {props.title ?? "Information"}
                    </Typography>
                </DialogTitle>
                {
                    props.showMinimize &&
                    <IconButton
                        onClick={toggleMinimize}
                        sx={{
                            position: 'absolute',
                            right: 48,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <MinimizeIcon />
                    </IconButton>
                }
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
                {
                    <DialogContent dividers
                        sx={
                            //Make the elements inside the dialog content part can occupy the full placehold
                            {
                                flex: (minHeight == "auto" || !minHeight ? "1 1 auto" : "1 1 0"),
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
                }
                {
                    actionPanel &&
                    <DialogActions>
                        {actionPanel}
                    </DialogActions>
                }
            </BootstrapDialog>
            {
                minimize && 
                <animated.div
                        style={{
                            position: "fixed",
                            zIndex: 1600,
                            margin: 0,
                            padding: 0,
                            cursor: isDraggingSD ? "grabbing" : "grab",
                            ...(positionSpeedDial.top !== undefined ? {
                                top: `${positionSpeedDial.top}px`,
                            } : {}),
                            ...(positionSpeedDial.left !== undefined ? {
                                left: `${positionSpeedDial.left}px`
                            } : {}),
                            ...(positionSpeedDial.right !== undefined ? {
                                right: `${positionSpeedDial.right}px`
                            } : {}),
                            ...(positionSpeedDial.bottom !== undefined ? {
                                bottom: `${positionSpeedDial.bottom}px`
                            } : {})
                        }}
                        ref={(elem) => {
                            dragSD(elem);
                            refSpeedDialWrapper.current = elem;
                        }}
                >
                        <Tooltip placement="top" arrow title="Recover to the original size~" >
                            <SpeedDial
                                ariaLabel="Recover to the original size"
                                icon={<SpeedDialIcon openIcon={<ExpandIcon />} />}
                                open={minimize}
                                onClick={toggleMinimize}
                                FabProps={{
                                    size: "small",
                                    disableRipple: true,
                                    sx: {
                                        margin: "0",
                                        width: "unset",
                                        height: "unset",
                                        padding: "8px",
                                        cursor: 'unset'
                                    },
                                    //avoid aria-hidden=true focus block error
                                    tabIndex: -1
                                }}
                            />
                        </Tooltip>
                </animated.div>
            }
        </>
    );
});

export default CustomizedDialog;