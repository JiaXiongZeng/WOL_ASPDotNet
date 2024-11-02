import styled from '@mui/material/styles/styled';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';

//Customize table head
export const TableHead = styled(MuiTableHead)({
    backgroundColor: '#03AED2',
    '& th': {
        fontWeight: "bold"
    }
});

//Customize table row
export const TableRow = styled(MuiTableRow)((/*{ theme }*/) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: "#FFFFFF" /*theme.palette.action.hover*/
    },
    '&:nth-of-type(even)': {
        backgroundColor: "#68D2EA"
    },
    '&:hover': {
        backgroundColor: "#FEEFAD !important"
        //backgroundColor: "rgba(0, 0, 0, 0.05) !important"
    }
}));

export default {
    TableHead,
    TableRow
}