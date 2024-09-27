import createTheme from '@mui/material/styles/createTheme';

const theme = createTheme({
    //To avoid UI to force change string to upper case, keeping the original one
    typography: {
        button: {
            textTransform: 'none'
        }
    },
    components: {
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#FFFFFF',
                    color: '#000000'
                }
            }
        }
    }
});

export default theme;