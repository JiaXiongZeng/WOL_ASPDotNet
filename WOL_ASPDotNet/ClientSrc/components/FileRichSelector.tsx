import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import { useImmer } from 'use-immer';
import '@extensions/ExtTreeViewBaseItem.d';

import clsx from 'clsx';
import { animated, useSpring } from '@react-spring/web';
import { styled, SxProps, Theme, alpha } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';

import StorageIcon from '@mui/icons-material/Storage';
import SummarizeIcon from '@mui/icons-material/Summarize';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderRounded from '@mui/icons-material/FolderRounded';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';

import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { useTreeViewApiRef } from '@mui/x-tree-view/hooks/useTreeViewApiRef';
import { treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { useTreeItem2, UseTreeItem2Parameters } from '@mui/x-tree-view/useTreeItem2';
import {
    TreeItem2Checkbox,
    TreeItem2Content,
    TreeItem2IconContainer,
    TreeItem2Label,
    TreeItem2Root,
} from '@mui/x-tree-view/TreeItem2';
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon';
import { TreeItem2Provider } from '@mui/x-tree-view/TreeItem2Provider';
import { TreeItem2DragAndDropOverlay } from '@mui/x-tree-view/TreeItem2DragAndDropOverlay';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';

import lodash from 'lodash';


export type FileType = 'storage' | 'image' | 'pdf' | 'doc' | 'video' | 'folder' | 'pinned' | 'trash' | 'others';

export type ItemInfo = {
    fileType?: FileType,
    path: string
}

export type ExtendedTreeItemProps = {
    fileType?: FileType;
    id: string;
    label: string;
};

function DotIcon() {
    return (
        <Box
            sx={{
                width: 6,
                height: 6,
                borderRadius: '70%',
                bgcolor: 'warning.main',
                display: 'inline-block',
                verticalAlign: 'middle',
                zIndex: 1,
                mx: 1,
            }}
        />
    );
}

const StyledTreeItemRoot = styled(TreeItem2Root)(({ theme }) => ({
    color: theme.palette.grey[400],
    position: 'relative',
    [`& .${treeItemClasses.groupTransition}`]: {
        marginLeft: theme.spacing(3.5),
    },
    ...theme.applyStyles('light', {
        color: theme.palette.grey[800],
    }),
}));

const CustomTreeItemContent = styled(TreeItem2Content)(({ theme }) => ({
    flexDirection: 'row-reverse', //Checkbox的順序
    borderRadius: theme.spacing(0.7),
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    paddingRight: theme.spacing(1),
    fontWeight: 500,
    [`&.Mui-expanded `]: {
        '&:not(.Mui-focused, .Mui-selected, .Mui-selected.Mui-focused) .labelIcon': {
            color: theme.palette.primary.dark,
            ...theme.applyStyles('light', {
                color: theme.palette.primary.main,
            }),
        },
        '&::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            left: '16px',
            top: '44px',
            height: 'calc(100% - 48px)',
            width: '1.5px',
            backgroundColor: theme.palette.grey[700],
            ...theme.applyStyles('light', {
                backgroundColor: theme.palette.grey[300],
            }),
        },
    },
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: 'white',
        ...theme.applyStyles('light', {
            color: theme.palette.primary.main,
        }),
    },
    [`&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused`]: {
        backgroundColor: alpha(theme.palette.primary.dark, 0.1),
        color: theme.palette.primary.contrastText,
        ...theme.applyStyles('light', {
            backgroundColor: alpha(theme.palette.primary.main, 0.6),
        }),
    },
}));

const AnimatedCollapse = animated(Collapse);

function TransitionComponent(props: TransitionProps) {
    const style = useSpring({
        to: {
            opacity: props.in ? 1 : 0,
            transform: `translate3d(0,${props.in ? 0 : 20}px,0)`,
        },
    });

    return <AnimatedCollapse style={style} {...props} />;
}

const StyledTreeItemLabelText = styled(Typography)({
    color: 'inherit',
    fontWeight: 500,
});

interface CustomLabelProps {
    children: React.ReactNode;
    icon?: React.ElementType;
    expandable?: boolean;
}

function CustomLabel({
    icon: Icon,
    expandable,
    children,
    ...other
}: CustomLabelProps) {
    return (
        <TreeItem2Label
            {...other}
            sx={{
                display: 'flex',
                alignItems: 'center',
            }}
        >
            {Icon && (
                <Box
                    component={Icon}
                    className="labelIcon"
                    color="inherit"
                    sx={{ mr: 1, fontSize: '1.2rem' }}
                />
            )}

            <StyledTreeItemLabelText variant="button">{children}</StyledTreeItemLabelText>
            {expandable && <DotIcon />}
        </TreeItem2Label>
    );
}

const isExpandable = (reactChildren: React.ReactNode) => {
    if (Array.isArray(reactChildren)) {
        return reactChildren.length > 0 && reactChildren.some(isExpandable);
    }
    return Boolean(reactChildren);
};

const getIconFromFileType = (fileType: FileType | string) => {
    switch (fileType) {
        case 'storage':
            return StorageIcon;
        case 'image':
            return ImageIcon;
        case 'pdf':
            return PictureAsPdfIcon;
        case 'doc':
            return SummarizeIcon;
        case 'video':
            return VideoCameraBackIcon;
        case 'folder':
            return FolderRounded;
        case 'pinned':
            return FolderOpenIcon;
        case 'trash':
            return DeleteIcon;
        default:
            return TextSnippetIcon;
    }
};

interface CustomTreeItemProps
    extends Omit<UseTreeItem2Parameters, 'rootRef'>,
    Omit<React.HTMLAttributes<HTMLLIElement>, 'onFocus'> { }

const CustomTreeItem = forwardRef((
    props: CustomTreeItemProps,
    ref: React.Ref<HTMLLIElement>,
) => {
    const { id, itemId, label, disabled, children, ...other } = props;

    const {
        getRootProps,
        getContentProps,
        getIconContainerProps,
        getCheckboxProps,
        getLabelProps,
        getGroupTransitionProps,
        getDragAndDropOverlayProps,
        status,
        publicAPI,
    } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref });

    const item = publicAPI.getItem(itemId);
    const expandable = isExpandable(children);
    let icon;
    if (expandable) {
        if (item.fileType == 'storage') {
            icon = StorageIcon;
        } else {
            icon = FolderRounded;
        }
    } else if (item.fileType) {
        icon = getIconFromFileType(item.fileType);
    }

    return (
        <TreeItem2Provider itemId={itemId}>
            <StyledTreeItemRoot {...getRootProps(other)}>
                <CustomTreeItemContent
                    {...getContentProps({
                        className: clsx('content', {
                            'Mui-expanded': status.expanded,
                            'Mui-selected': status.selected,
                            'Mui-focused': status.focused,
                            'Mui-disabled': status.disabled,
                        }),
                    })}
                >
                    <TreeItem2IconContainer {...getIconContainerProps()}>
                        <TreeItem2Icon status={status} />
                    </TreeItem2IconContainer>
                    <TreeItem2Checkbox {...getCheckboxProps()} />
                    <CustomLabel
                        {...getLabelProps({ icon, expandable: expandable && status.expanded })}
                    />
                    <TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />
                </CustomTreeItemContent>
                {children && <TransitionComponent {...getGroupTransitionProps()} />}
            </StyledTreeItemRoot>
        </TreeItem2Provider>
    );
});



export interface FileRichSelectorProps
{
    nodes: TreeViewBaseItem<ExtendedTreeItemProps>[],
    sx: SxProps<Theme>,
    onItemToggled?: (itemInfo: ItemInfo) => void
}

export type FileRichSelectorHandler =
{
    resetAll: () => void,
    setFileSystemNodes: (nodes: TreeViewBaseItem<ExtendedTreeItemProps>[]) => void,
    getSelectedPathes: () => string[],
    getSelectedFilePathes: () => string[],
    getSelectedNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[],
    getSelectedFolderNodes: () => TreeViewBaseItem<ExtendedTreeItemProps>[],
    setItemFocused: (e: React.SyntheticEvent,  itemId: string) => void,
    getFocusedItemDOM: (itemId: string) => Nullable<HTMLElement> | undefined
} 

export const FileRichSelector = forwardRef<FileRichSelectorHandler, FileRichSelectorProps>((props, ref) => {
    const { nodes, sx, onItemToggled } = props;
    const [fileSystemTree, setFileSystemTree] = useState<TreeViewBaseItem<ExtendedTreeItemProps>[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [expandedItems, setExpandedItems] = useImmer<string[]>([]);
    const refTreeAPI = useTreeViewApiRef();
    const refTreeView = useRef<HTMLUListElement>(null);

    useEffect(() => {
        setFileSystemTree(nodes);
    }, [nodes]);

    useImperativeHandle(ref, () => ({
        resetAll: () => {
            setFileSystemTree([]);
            setSelectedItems([]);
            setExpandedItems([]);
        },
        setFileSystemNodes: (nodes) => {
            setFileSystemTree(nodes);
        },
        getSelectedPathes: () => {
            return selectedItems;
        },
        getSelectedFilePathes: () => {
            const items = fileSystemTree.findItemsByIds(selectedItems);
            const fileItems = lodash.filter(items, x => !(x.fileType == 'folder' || x.fileType == 'storage'));
            const filePathes = fileItems.map(x => x.id);
            return filePathes;
        },
        getSelectedNodes: () => {
            const items = fileSystemTree.findItemsByIds(selectedItems);
            return items;
        },
        getSelectedFolderNodes: () => {
            const items = fileSystemTree.findItemsByIds(selectedItems);
            const folderItems = lodash.filter(items, x => (x.fileType == 'folder' || x.fileType == 'storage'));
            return folderItems;
        },
        setItemFocused: (e, itemId) => {
            refTreeAPI.current?.focusItem(e, itemId);
        },
        getFocusedItemDOM: (itemId) => {
            return refTreeAPI.current?.getItemDOMElement(itemId);
        }
    }), [selectedItems]);

    return (
        <RichTreeView
            items={fileSystemTree}
            /*defaultExpandedItems={['1', '1.1']}
            defaultSelectedItems={["1.1"]}*/

            apiRef={refTreeAPI}
            selectedItems={selectedItems}
            onItemSelectionToggle={(_e, itemId, isSelected) => {
                //Automatically select/de-select all children recursively
                const itemList = fileSystemTree.findItemsByIds([itemId]);
                const Ids = itemList.getAllTreeIds();
                if (isSelected) {
                    const newSelectedItems = lodash.union(selectedItems, Ids);
                    setSelectedItems(newSelectedItems);
                } else {
                    const newSelectedItems = lodash.difference(selectedItems, Ids);
                    setSelectedItems(newSelectedItems);
                }
            }}
            onItemExpansionToggle={(_e, itemId, isExpanded) => {
                const idxItem = expandedItems.indexOf(itemId);
                if (isExpanded) {
                    if (idxItem == -1) {
                        setExpandedItems(draft => {
                            draft.push(itemId)
                        });
                    }
                } else {
                    if (idxItem != -1) {
                        setExpandedItems(draft => {
                            draft = lodash.remove(draft, x => x == itemId)
                        });
                    }
                }
            }}
            onItemFocus={(e, itemId) => {
                const theItem = refTreeAPI.current?.getItem(itemId) as ExtendedTreeItemProps;

                //Load the children of current focused node from Guacamole socket
                onItemToggled && onItemToggled({
                    fileType: theItem.fileType,
                    path: theItem.id
                });

                //Automatically expand the children nodes
                setTimeout(() => {
                    const isExpanded = lodash.some(expandedItems, x => x == itemId);
                    refTreeAPI.current?.setItemExpansion(e || {} as React.SyntheticEvent, itemId, !isExpanded);                  
                }, 100);
            }}

            checkboxSelection
            multiSelect
            sx={{
                '& ul': {
                    paddingInlineStart: '15px'
                },
                ...sx
            }}
            slots={{ item: CustomTreeItem }}
            ref={refTreeView} 
        />
    );
});

export default FileRichSelector;