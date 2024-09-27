import {
    useEffect, useState, useMemo,
    forwardRef, useImperativeHandle
} from 'react';

import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import IconButton from '@mui/material/IconButton';
import CallIcon from '@mui/icons-material/Call';
import CheckIcon from '@mui/icons-material/Check';

import {
    MaterialReactTable,
    useMaterialReactTable,
    //getMRT_RowSelectionHandler,
    type MRT_ColumnDef
} from 'material-react-table';

import { UserInfoViewModel } from '@models/UserInfoViewModel';
import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';

import axios from 'axios';

export interface UserListProp {

}

export type UserListHandler = {
    reload: () => void,
    getSelectedItems: () => UserInfoViewModel[]
}


type ApiResponse = ResponseMessage<UserInfoViewModel[]>;

const UserList = forwardRef<UserListHandler, UserListProp>((_props, ref) => {
    const [data, setData] = useState<UserInfoViewModel[]>([]);

    const getUserList = async () => {
        await axios.get<ApiResponse>('/Identity/GetUserInfoList', {
            responseType: "json"
        }).then(response => {
            const respData = response.data;
            if (respData.Status == MESSAGE_STATUS.OK) {
                setData(respData.Attachment!);
            }
        });
    };

    useEffect(() => {
        getUserList();
    }, []);

    useImperativeHandle(ref, () => ({
        reload: getUserList,
        getSelectedItems: () => {
            const rowModels = table.getSelectedRowModel().flatRows;
            const users = rowModels.map(x => x.original);
            return users;
        }
    }), []);

    const columns = useMemo<MRT_ColumnDef<UserInfoViewModel>[]>(
        () => [
            {
                id: 'LocalID',
                header: 'Local ID',
                accessorKey: 'LocalID',
                Cell: ({ renderedCellValue }) => (
                    <Typography>
                        {renderedCellValue}
                    </Typography>
                )
            },
            {
                id: 'UserName',
                header: 'User Name',
                accessorKey: 'UserName'
            },
            {
                id: 'Email',
                header: 'Email',
                accessorKey: 'Email'
            },
            {
                id: 'Phone',
                header: 'Phone',
                accessorKey: 'Phone',
                Cell: ({ renderedCellValue }) => (
                    <>
                        {
                            renderedCellValue ?
                                <Tooltip arrow={true} title={ renderedCellValue } >
                                    <IconButton>
                                        <CallIcon />
                                    </IconButton>
                                </Tooltip>
                                : '-'
                        }
                        
                    </>
                )
            },
            {
                id: 'isAdmin',
                header: 'Admin',
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.IsAdmin ? <CheckIcon /> : null
                )
            },
            {
                id: 'status',
                header: 'Active',
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.Status == 'A' ? <CheckIcon /> : null
                )
            }

        ],
        []  //Dependencies
    );

    const table = useMaterialReactTable({
        columns,
        data,
        enableGlobalFilter:true,
        //enableColumnFilterModes: true,
        //enableColumnOrdering: true,
        //enableColumnPinning: true,
        enableRowSelection: true,
        enableFullScreenToggle: false,
        enableDensityToggle: false,
        enableHiding:false,
        initialState: {
            columnPinning: {
                left: ['mrt-row-select']
            },
            showGlobalFilter: true,
            density: 'compact'
        },
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        muiSearchTextFieldProps: {
            size: 'small',
            variant: 'outlined'
        },
        muiPaginationProps: {
            color: 'secondary',
            rowsPerPageOptions: [10, 20, 30],
            shape: 'rounded',
            variant: 'outlined',
        },
        muiTableBodyRowProps: ({ row/*, staticRowIndex, table*/ }) => ({
            //onClick: (event) =>
            //    getMRT_RowSelectionHandler({ row, staticRowIndex, table })(event), //import this helper function from material-react-table
            onClick: row.getToggleSelectedHandler(),
            sx: {
                cursor: 'pointer',
                //stripe the rows, make odd rows a darker color
                '&:nth-of-type(odd) > td': {
                    backgroundColor: "white"
                },
                '&:nth-of-type(even) > td': {
                    backgroundColor: "#68D2EA"
                },
                //經觀察滑鼠移過Row的顏色要調整成這樣，不然顏色怪怪的
                '&.MuiTableRow-root:hover > td:after': {
                    backgroundColor: "#FEEFAD"
                }
            },
        }),
        //renderTopToolbar: ({ table }) => {            
        //    return (
        //        <IconButton onClick = {() => {
        //            console.log(table.getSelectedRowModel().flatRows);
        //        } }  >
        //            <EditIcon/>
        //        </IconButton>
        //    );
        //}
    });


    return (
        <>             
            <MaterialReactTable table={table} />
        </>
    );
});

export default UserList;