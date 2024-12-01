import { TreeViewBaseItem } from '@mui/x-tree-view/models';
export { }

declare global {
    interface Array<T> {
        findItemsByIds(ids: string[]): T[];
        getAllTreeIds(): string[];
    }
}

if (Array.prototype.findItemsByIds !== 'function') {
    Array.prototype.findItemsByIds = function <R extends { id: string, label: string, children?: R[] }>
        (this: R[], ids: string[]): R[] {
            const result: R[] = [];

            const search = (items: R[]) => {
                for (const item of items) {
                    if (ids.includes(item.id)) {
                        result.push(item);
                    }
                    if (item.children) {
                        search(item.children);
                    }
                }
            };

            search(this);
            return result;
    }
}

if (Array.prototype.getAllTreeIds !== 'function') {
    Array.prototype.getAllTreeIds = function <R extends { id: string, label: string, children?: R[] }>
        (this: R[]): string[] {
            const result: string[] = [];

            const traverse = (items: R[]) => {
                for (const item of items) {
                    if (item.id) {
                        result.push(item.id);
                    }

                    if (item.children) {
                        traverse(item.children);
                    }
                }
            };

            traverse(this);
            return result;
    }
}