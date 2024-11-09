import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import lodash from 'lodash';


type PathInfo = {
    label: string,
    path: string
}

const expandPathToInfoList = (path: string) => {
    const result: PathInfo[] = [];
    const tokens = path.split('/');
    lodash.forEach(tokens, (token, idx) => {
        const subTokens = tokens.slice(0, idx + 1);
        result.push({
            label: token,
            path: `${lodash.join(subTokens, '/')}`
        });
    });
    return result;
}

export const FileBreadcrumbs = (props: {
    path: string,
    handlePathChange: (e: React.SyntheticEvent,newPath: string) => void
}) => {
    const { path, handlePathChange } = props;
    const infoList = expandPathToInfoList(path);

    const breadcrumbLinks = infoList.map((info, index) => {
        const isLast = index === infoList.length - 1;
        const link = isLast ? (
            <Box sx={{
                bgcolor: 'warning.light',
                borderRadius: 1,
                paddingLeft: '8px',
                paddingRight: '8px'
            }}>
                <Typography variant="button" key={info.path} color="text.secondary" >{info.label}</Typography>
            </Box>
        ) : (
            <Link
                variant="button"
                key={info.path}
                color="inherit"
                onClick={(e) => { handlePathChange(e, info.path) }}
                style={{ cursor: 'pointer' }}
            >
                {info.label}
            </Link>
        );
        return link;
    });

    return (
        <Breadcrumbs maxItems={4} itemsBeforeCollapse={0} itemsAfterCollapse={4}
            sx={{
                '& .MuiBreadcrumbs-separator': {
                    marginLeft: '0px',
                    marginRight: '0px'
                },
                paddingLeft: '8px',
                paddingRight: '8px',
                marginBottom: '4px'
            }} >
            {breadcrumbLinks}
        </Breadcrumbs>
    );
};

export default FileBreadcrumbs;