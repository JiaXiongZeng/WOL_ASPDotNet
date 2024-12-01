/**
 * Wrap a event driven object with a Promise object
 * This is a utility to wrap a onXXXX event driven design to a Promise asynchronous design
 * It will help to make logic in onXXXX event can be converted to await async flow by invoking resolve/reject callbacks
 * @param Task a task with resolve and reject callbacks of a Promise object
 * @returns a Promise object
 */
export const MakePromise =
    (Task: (resolve: (value: unknown) => void, reject: (reason?: any) => void) => void) => {
    const thePromise = new Promise<unknown>((resolveCb, rejectCb) => {
        Task(resolveCb, rejectCb);
    });
    return thePromise;
}

export default MakePromise;