export type PageModel<T> = {
    data: T[]
    meta: {
        totalRowCount: number
    }
}