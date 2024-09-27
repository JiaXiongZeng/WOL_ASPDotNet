import * as lodash from 'lodash';

export const formatMacAddress = (str: string) => {

    let result: string = "";
    const spliter = ":";
    const normalizedStr = lodash.replace(str, /[^\w]+/gm, "");


    if (normalizedStr.length == 12) {
        const itrTimes = 12 / 2;

        for (let i = 0; i < itrTimes; i++) {
            const sIdx: number = i * 2;
            const eIdx: number = i * 2 + 2;
            result += normalizedStr.substring(sIdx, eIdx) + spliter;
        }

        result = lodash.trimEnd(result, spliter);    
    } else {
        throw new Error("Not a valid mac address");
    }

    return result;
}