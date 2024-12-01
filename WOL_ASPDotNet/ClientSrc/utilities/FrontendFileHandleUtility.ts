import { FileSystemDirectoryHandle, FileSystemFileHandle } from 'native-file-system-adapter';
import * as lodash from 'lodash';

class FileSystemCache {
    private cache: Map<string, FileSystemDirectoryHandle>;
    private maxSize: number;

    constructor(maxSize: number = 5) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    // Get a cached directory handle by its path
    get(path: string): FileSystemDirectoryHandle | undefined {
        return this.cache.get(path);
    }

    // Cache a directory handle by its path
    set(path: string, handle: FileSystemDirectoryHandle) {
        if (this.cache.size >= this.maxSize) {
            // Remove the oldest cached entry if max size is reached
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(path, handle);
    }

    // Clear all
    clear() {
        this.cache.clear();
    }
}

class FrontendFileHandleUtility {
    private cache: FileSystemCache;

    constructor() {
        this.cache = new FileSystemCache();
    }

    reset() {
        this.cache.clear();
    }

    async getNestedDirectoryHandle(
        rootDirHandle: FileSystemDirectoryHandle,
        path: string
    ): Promise<FileSystemDirectoryHandle> {
        // Check if the directory is already cached
        let cachedHandle = this.cache.get(path);
        if (cachedHandle) {
            return cachedHandle;
        }

        let currentDirectory = rootDirHandle;
        const rootName = `/${lodash.replace(rootDirHandle.name, "\\", "")}`;        
        if (path != rootName) {
            // If not cached, traverse the path to get the directory handle
            //Normalize path
            path = lodash.trimStart(path, rootName);

            const parts = path.split('/');
            for (const part of parts) {
                currentDirectory = await currentDirectory.getDirectoryHandle(part);
            }
        }

        // Cache the directory handle for future access
        this.cache.set(path, currentDirectory);
        return currentDirectory;
    }

    async getNestedFileHandle(
        rootDirHandle: FileSystemDirectoryHandle,
        path: string
    ): Promise<FileSystemFileHandle> {
        // Extract directory path and file name
        const directoryPath = path.substring(0, path.lastIndexOf('/'));
        const fileName = path.substring(path.lastIndexOf('/') + 1);

        // Get the directory handle
        const dirHandle = await this.getNestedDirectoryHandle(rootDirHandle, directoryPath);

        // Get the file handle
        const fileHandle = await dirHandle.getFileHandle(fileName);
        return fileHandle;
    }
}

//Convert File to Blob
export const FileToBlob = async (file: File) =>
    new Blob([new Uint8Array(await file.arrayBuffer())], { type: file.type });

//FrontendFileHandleUtility module
export const FrontendFileHandleUtil = new FrontendFileHandleUtility();
export default FrontendFileHandleUtil;