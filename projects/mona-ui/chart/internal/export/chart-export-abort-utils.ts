/**
 * Wraps a promise to reject immediately with an AbortError if the provided AbortSignal fires.
 */
export async function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) {
        return promise;
    }
    if (signal.aborted) {
        throw new DOMException("Export was aborted", "AbortError");
    }

    return new Promise<T>((resolve, reject) => {
        const onAbort = () => {
            reject(new DOMException("Export was aborted", "AbortError"));
        };

        signal.addEventListener("abort", onAbort, { once: true });

        promise
            .then(val => {
                signal.removeEventListener("abort", onAbort);
                resolve(val);
            })
            .catch(err => {
                signal.removeEventListener("abort", onAbort);
                reject(err);
            });
    });
}

/**
 * Throws a DOMException("Export was aborted", "AbortError") if the signal is aborted.
 */
export function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new DOMException("Export was aborted", "AbortError");
    }
}
