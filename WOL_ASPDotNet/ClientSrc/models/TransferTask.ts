export type TransferStatus = {
    ProcessedSize: number,
    TriggerTime: Date
}

export type TransferTask = {
    Id: string,
    FileName: string,
    Action: 'Download' | 'Upload',
    RunTask: (args: any) => Promise<unknown>,
    TaskStatus: 'Queue' | 'Running' | 'Success' | 'Error'
    CurrentTransStatus?: TransferStatus,
    PreviousTransStatus?: TransferStatus,
    TotalSize?: string,
    TransferRate?: string
}

export type SizeExpression = {
    Size: string,
    Unit: string
}

/**
 * Get humanlike size description
 * @param sizeInBytes file size in bytes
 * @returns
 */
export const genHumanlikeSizeDesc =
    (sizeInBytes: number): SizeExpression => {
        let unit = "";
        let sizeInUnit = sizeInBytes;

        unit = "KB";
        const sizeInKB = sizeInBytes / 1024;
        if (Math.floor(sizeInKB / 1024) == 0) {
            sizeInUnit = sizeInKB;
            return {
                Size: sizeInUnit.toFixed(2),
                Unit: unit
            };
        }

        unit = "MB";
        const sizeInMB = sizeInBytes / (1024 ** 2);
        if (Math.floor(sizeInMB / 1024) == 0) {
            sizeInUnit = sizeInMB;
            return {
                Size: sizeInUnit.toFixed(2),
                Unit: unit
            };
        }

        unit = "GB";
        const sizeInGB = sizeInBytes / (1024 ** 3);
        if (Math.floor(sizeInGB / 1024) == 0) {
            sizeInUnit = sizeInGB;
            return {
                Size: sizeInUnit.toFixed(2),
                Unit: unit
            };
        }

        unit = "TB";
        const sizeInTB = sizeInBytes / (1024 ** 4);
        sizeInUnit = sizeInTB;
        return {
            Size: sizeInUnit.toFixed(2),
            Unit: unit
        };
    }

/**
 * Get the file name part of a file path
 * @param path a file path
 * @returns
 */
export const getFileName = (path: string) => {
    const idxOfLastSlash = path.lastIndexOf("/");
    const fileName = path.substring(idxOfLastSlash + 1);
    return fileName;
}