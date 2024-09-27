import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import {
    useForm, useFieldArray, type UseFieldArrayUpdate
} from 'react-hook-form';

import { HostViewModel } from '@models/HostViewModel';
import { HostListHandler } from '@components/HostList';


const fieldArrName = 'hostList';

interface EditFormCardProp {
    index: number,
    value: HostViewModel
    update: UseFieldArrayUpdate<{ [fieldArrName]: HostViewModel[] }>
}

const EditFormCard = (props: EditFormCardProp) => {
    const { value, index, update } = props;
    const {
        register,
        reset,
        setValue,
        watch
    } = useForm({
        defaultValues: value
    });

    const portRange = {
        min: 0,
        max: 65535
    }

    const { ref, ...rest } = register("WOL_Port");
    const numberTestRef = useRef<HTMLDivElement | null>(null);

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
    }

    //To prevent the value of port change by rolling mouse wheel
    //It's necessary to turn off the "passive mode" to enable "e.prevnetDefault()" method invoked
    useEffect(() => {
        numberTestRef.current?.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            numberTestRef.current?.removeEventListener('wheel', handleWheel);
        }
    }, []);

    //Observe the change of form values and upate to data model
    useEffect(() => {
        const subscription = watch((value) => {
            update(index, value as HostViewModel);
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    return (
        <CardContent sx={{
            display: "flex",
            flexDirection: "column"
        }}>
            <Typography sx={{
                fontSize: 14,
                backgroundColor: "#03AED2",
                padding: "0.2em 0.2em 0.2em 0.5em",
                borderRadius: 1
            }} color="text.secondary" gutterBottom component="div" >
                <div style={{
                    fontWeight: "bold",
                    pointerEvents: "none",
                    display: "inline-flex",
                    marginRight: "0.5em"
                }}>Mac Address</div>{value.MacAddress}
                <Tooltip arrow title="Reset to initial one">
                    <IconButton onClick={() => {
                        reset();
                    }}>
                        <RotateLeftIcon />
                    </IconButton>
                </Tooltip>
            </Typography>

            <TextField
                label="Host Name"
                {...register("HostName")}
                size="small"
                variant="standard"
                autoComplete="off"
            />            
            <TextField
                label="Domain"
                {...register("Domain")}
                size="small"
                variant="standard"
                autoComplete="off"
            />
            <TextField
                label="IPv4"
                {...register("IPv4")}
                size="small"
                variant="standard"
                autoComplete="off"
            />
            <TextField
                type="number"
                label="Port"
                {...rest}
                InputProps={{
                    inputProps: {
                        min: portRange.min,
                        max: portRange.max
                    }
                }}
                InputLabelProps={{
                    shrink: true
                }}
                variant="standard"
                onChange={(e) => {
                    const portNum = parseInt(e.target.value);
                    if (isNaN(portNum)) {
                        e.target.value = "0";
                    }

                    if (portNum > portRange.max) {
                        e.target.value = portRange.max.toString();
                    }

                    if (portNum < portRange.min) {
                        e.target.value = portRange.min.toString();
                    }

                    //Normalize numeric string
                    if (e.target.value) {
                        const num = parseInt(e.target.value);
                        e.target.value = num.toString();
                    }

                    setValue("WOL_Port", parseInt(e.target.value));
                }}
                ref={(elem) => {
                    ref(elem);
                    numberTestRef.current = elem;
                }}
            />
        </CardContent>
    );
}

interface HostEditFormListProp {
    refHostList: React.RefObject<HostListHandler>
}

export type HostEditFormListHandler = {
    getSubmitData: () => HostViewModel[]
}

export const HostEditFormList = forwardRef<HostEditFormListHandler, HostEditFormListProp>((props, ref) => {
    const { refHostList } = props;
    const [hostList, setHostList] = useState<HostViewModel[] | undefined>();

    const { control, setValue, watch } = useForm({
        defaultValues: {
            [fieldArrName]: [] as HostViewModel[]
        }
    });

    const { update } = useFieldArray({
        control,
        name: fieldArrName
    });

    useEffect(() => {
        const hostList = refHostList.current?.getSelectedItems();
        setHostList(hostList);
        setValue(fieldArrName, hostList!);
    }, []);

    useImperativeHandle(ref, () => {
        return {
            getSubmitData: () => {
                const result = watch(fieldArrName);
                return result;               
            }
        }
    })

    return (
        <>
            {
                (!hostList || !hostList.length) &&
                <Typography variant="h6" color="text.secondary" gutterBottom component="div" >
                    Please select at least one host~
                </Typography>
            }
            {
                hostList?.map((val, idx) =>
                    <EditFormCard index={idx} value={val} update={update} key={`${fieldArrName}.${idx}`}  />
                )
            }
        </>
    );
});

export default HostEditFormList;