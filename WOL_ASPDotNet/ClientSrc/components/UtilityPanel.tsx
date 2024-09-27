import {
    useState, useCallback, useEffect,
    forwardRef, useImperativeHandle,
    useRef
} from 'react';

import { useImmer } from 'use-immer';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import { MESSAGE_STATUS, ResponseMessage } from '@models/ResponseMessage';
import { HostViewModel } from '@models/HostViewModel';
import { ICMPEchoInfo } from '@models/ICMPEchoInfo';

import axios from 'axios';
import dayjs from 'dayjs';
import * as lodash from 'lodash';

export interface UtilityPanelProps {
    data: HostViewModel
}

export type UtilityPanelHandler = {
    startPing: () => void,
    stopPing: () => void
}

const timeDiff = (futrue: string, past: string) => {
    const date1 = dayjs(futrue);
    const date2 = dayjs(past);
    const ms = date1.diff(date2, 'millisecond');
    return ms;
}

const UtilityPanel = forwardRef<UtilityPanelHandler, UtilityPanelProps>((props, ref) => {
    const { data } = props;
    const [host] = useState(data);
    const [pingInfoList, setPingInfoList] = useImmer<ICMPEchoInfo[]>([]);
    const [isActivated, setIsActivated] = useState<boolean>(false);
    const [promiseList, setPromiseList] = useState<Promise<void>[]>([]);
    const refLastOne = useRef<HTMLElement>(null);


    const genNewRequest = useCallback(() => {
        return axios.get<ResponseMessage<ICMPEchoInfo>>('Host/PingInternal', {
            responseType: "json",
            params: {
                IPv4: host.IPv4,
                Mac: host.MacAddress
            }
        }).then(response => {
            var respData = response.data;
            if (respData.Status == MESSAGE_STATUS.OK) {
                setPingInfoList(draft => {
                    draft.push(respData.Attachment!);
                });

                setTimeout(() => {
                    refLastOne.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
                
            }
        });
    }, [promiseList]);


    useEffect(lodash.debounce(() => {
        if (isActivated) {
            Promise.all(promiseList)
                .then(() => {
                    setPromiseList([genNewRequest()]);
                });
        } else {
            if (promiseList.length > 0) {
                setPromiseList([]);
            }
        }

        return () => {
            if (promiseList.length > 0) {
                setPromiseList([]);
            }
        };
    }, 1100), [isActivated, promiseList]);


    useImperativeHandle(ref, () => ({
        startPing: () => {
            setIsActivated(true);
        },
        stopPing: () => {
            setIsActivated(false);
        }
    }));

    return (
        <Box height="30vh">
            <Typography component="div" gutterBottom>
                {
                    pingInfoList.length > 0
                        ?
                        <List key={ `List-${data.MacAddress}` } dense={true} sx={{
                            padding: 0
                        }} >
                            {
                                pingInfoList.map((x, index) =>
                                    <ListItem key={ `Item-${index}` } >
                                        {index == pingInfoList.length - 1
                                        ?
                                            <ListItemText key={ `Text-${index}` } ref={refLastOne} >
                                                Ping {data.IPv4} {x.IsTimeout ? "Time out" : `${timeDiff(x.ResponseTime, x.RequestTime)} ms TTL 128`}
                                            </ListItemText>
                                        :
                                            <ListItemText key={ `Text-${index}` } >
                                                Ping {data.IPv4} {x.IsTimeout ? "Time out" : `${timeDiff(x.ResponseTime, x.RequestTime)} ms TTL 128`}
                                            </ListItemText>
                                        }
                                    </ListItem>
                                )
                            }                        
                        </List>
                        :
                        <>
                            Waiting for instructions
                            <LinearProgress color="inherit" />
                        </>
                }
            </Typography>
        </Box>    
    );
});

export default UtilityPanel;