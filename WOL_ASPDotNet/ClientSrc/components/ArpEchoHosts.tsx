import {
    useMemo, useState, useRef,
    forwardRef, useImperativeHandle
} from 'react';

import {
    MRT_RowSelectionState,
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_ColumnFiltersState,
    type MRT_PaginationState,
    type MRT_SortingState

} from 'material-react-table';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal';

import {
    keepPreviousData,
    useQuery,
} from '@tanstack/react-query';

import axios from 'axios';

import dayjs from 'dayjs';

import CustomizedDialog, { CustomizedDialogHandler } from '@components/CustomizedDialog';

import { type HostDetectViewModel } from '@models/HostDetectViewModel';
import { PageModel } from '@models/PageModel';
import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';

type ResponseType = Nullable<PageModel<HostDetectViewModel>> | undefined;
type ApiResponse = ResponseMessage<ResponseType>;

export type ArpEchoHostsHandler = {
    getSelectedRows: () => HostDetectViewModel[],
    clearSelectedRows: () => void
}

const ArpEchoHosts = forwardRef<ArpEchoHostsHandler>((_props, ref) => {
    const modalRef = useRef<CustomizedDialogHandler>(null);

    const sniffOnNetwork = async () => {
        modalRef.current?.setOpen(true);

        await axios.get<void>('Host/SniffHostsOnNetwork', {
            responseType: "text"
        }).then(() => {
            modalRef.current?.setOpen(false);
        }).catch(() => {
            modalRef.current?.setOpen(false);
        });
    }


    const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<MRT_SortingState>([]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    //Access the row selection state
    const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

    //consider storing this code in a custom hook (i.e useFetchUsers)
    const {
        data = {
            data: [],
            meta: {
                totalRowCount: 0
            }
        }, //your data and api response will probably be different
        isError,
        isRefetching,
        isLoading,
        refetch,
    } = useQuery<ResponseType>({
        queryKey: [
            'table-data',
            columnFilters, //refetch when columnFilters changes
            globalFilter, //refetch when globalFilter changes
            pagination.pageIndex, //refetch when pagination.pageIndex changes
            pagination.pageSize, //refetch when pagination.pageSize changes
            sorting, //refetch when sorting changes
        ],
        queryFn: async () => {
            const responseMessage = await axios.get<ApiResponse>('/Host/GetArpEchoHostList', {
                responseType: "json",
                params: {
                    'start': `${pagination.pageIndex * pagination.pageSize}`,
                    'size': `${pagination.pageSize}`,
                    'filters': JSON.stringify(columnFilters ?? []),
                    'globalFilter': (globalFilter ?? ''),
                    'sorting': JSON.stringify(sorting ?? [])
                }
            }).then(response => response.data);


            let responseData: ResponseType;
            if (responseMessage.Status == MESSAGE_STATUS.OK) {
                responseData = responseMessage.Attachment;
            }

            return responseData;
        },
        placeholderData: keepPreviousData, //don't go to 0 rows when refetching or paginating to next page
    });

    const columns = useMemo<MRT_ColumnDef<HostDetectViewModel>[]>(() => [
        {
            accessorKey: 'HostName',
            header: 'Host Name',
            enableSorting: true
        },
        {
            accessorKey: 'IPv4',
            header: 'IPv4',
            enableSorting: true
        },
        {
            accessorKey: 'IPv6',
            header: 'IPv6',
            enableSorting: true,
            enableHiding: true
        },
        {
            accessorKey: 'Mac',
            header: 'Mac',
            enableSorting: true
        },
        {
            accessorKey: 'CreateTime',
            header: 'Create Time',
            Cell: ({ cell }) => {
                const timing = cell.getValue<Date>();
                const strTiming = dayjs(timing).format("YYYY-MM-DD HH:mm:ss");

                return (
                    <span>{strTiming}</span>
                );
            },
            enableSorting: true
        },
        {
            accessorKey: 'UpdateTIme',
            header: 'Update Time',
            enableSorting: true
        }
    ], []);

    const table = useMaterialReactTable({
        columns: columns,
        data: data?.data!,
        initialState: {
            showColumnFilters: true,
            density: 'compact'
        },
        enableStickyHeader: true,
        enableTopToolbar: true,
        enableDensityToggle: false,
        enableHiding: false,
        enableFullScreenToggle: false,
        enableRowSelection: true,
        getRowId: (row) => row.Mac,        
        positionToolbarAlertBanner: 'bottom',
        //Access the row selection state
        onRowSelectionChange: setRowSelection,
        //讓Paper裡面的內容物可以完全佔滿版面
        muiTablePaperProps: {
            sx: {
                flex: "1 1 0",
                display: "flex",
                flexFlow: "column"
            }
        },
        //讓Table完全補滿Paper的版面
        muiTableContainerProps: {
            sx: {
                flex: "1 1 0"
            }
        },
        //muiSelectCheckboxProps: {
        //    color: 'secondary'
        //},
        //muiTableHeadCellProps: {
        //    sx: {
        //        backgroundColor: '#03AED2',
        //        '& th': {
        //            fontWeight: "bold"
        //        },
        //        '& .MuiInput-root': {
        //            backgroundColor: 'white'
        //        }
        //    }
        //},
        muiTableBodyRowProps: ({ row }) => ({
            //add onClick to row to select upon clicking anywhere in the row
            onClick: row.getToggleSelectedHandler(),
            hover: true,
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
        manualFiltering: true, //turn off built-in client-side filtering
        manualPagination: true, //turn off built-in client-side pagination
        manualSorting: true, //turn off built-in client-side sorting
        muiToolbarAlertBannerProps: isError
            ? {
                color: 'error',
                children: 'Error loading data',
            }
            : undefined,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        renderTopToolbarCustomActions: () => (
            <Stack direction="row">
                <Tooltip arrow placement="top-end" title="Refresh Data">
                    <IconButton onClick={() => refetch()}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip arrow placement="top-end" title="Inquiry hosts on network">
                    <IconButton onClick={sniffOnNetwork}>
                        <BroadcastOnPersonalIcon />
                    </IconButton>
                </Tooltip>
            </Stack>
        ),
        rowCount: (data?.meta.totalRowCount ?? 0),
        state: {
            columnFilters,
            globalFilter,
            isLoading,
            pagination,
            showAlertBanner: isError,
            showProgressBars: isRefetching,
            sorting,
            //Access the row selection state
            rowSelection
        },
    });

    useImperativeHandle(ref, () => {
        return {
            clearSelectedRows: () => {
                setRowSelection({});
            },
            getSelectedRows: () => {
                return table.getSelectedRowModel().rows.map((row) => row.original);
            }
        };
    }, []);

    return (
        <>
            <MaterialReactTable table={table} />
            <CustomizedDialog
                title="Inquiry hosts on network"
                open={false}
                showClose={false}
                ref={modalRef}  >
                <Box>
                    <Typography component="div" gutterBottom>
                        Sniffing on the network
                        <LinearProgress color="inherit" />
                    </Typography>
                </Box>
            </CustomizedDialog>
        </>
    );
});

export default ArpEchoHosts;