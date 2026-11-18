import { HttpEventType, HttpResponse, HttpResponseBase } from "@angular/common/http";
import { isObservable, type Observable, type Subscription } from "rxjs";

/** What an upload function gets with each file. The file upload's `FileUploadContext` has the same shape. */
export interface UploadRunContext {
    /** Reports how much of the file has been sent. `total` defaults to the file's size. */
    progress(loaded: number, total?: number): void;

    /** Aborted when the upload is stopped. */
    readonly signal: AbortSignal;
}

/** An upload function, as the file upload's `FileUploadHandler`: it returns a promise or an observable. */
export type UploadRunHandler = (file: File, context: UploadRunContext) => Observable<unknown> | Promise<unknown>;

/** What {@link runUpload} reports. None of them runs after the upload is stopped. */
export interface UploadRunCallbacks {
    /** The upload failed, with what it failed with. */
    failure(error: unknown): void;

    /** How much of the file has been sent, from 0 to 1. */
    progress(fraction: number): void;

    /** The upload finished, with what it returned. */
    success(response: unknown): void;
}

/** Whether a value is an HttpClient event other than the response, which carries no result of its own. */
function isHttpEventWithoutResult(value: unknown): boolean {
    if (value instanceof HttpResponseBase) {
        return !(value instanceof HttpResponse);
    }
    if (value == null || typeof value !== "object") {
        return false;
    }
    const type = (value as { readonly type?: unknown }).type;
    if (type === HttpEventType.Sent) {
        return Object.keys(value).length === 1;
    }
    return (
        (type === HttpEventType.UploadProgress || type === HttpEventType.DownloadProgress) &&
        typeof (value as { readonly loaded?: unknown }).loaded === "number"
    );
}

/** The bytes sent so far and the total, when a value is HttpClient's upload progress event. */
function httpUploadProgress(value: unknown): { readonly loaded: number; readonly total?: number } | null {
    if (value == null || typeof value !== "object") {
        return null;
    }
    const event = value as { readonly loaded?: unknown; readonly total?: unknown; readonly type?: unknown };
    if (event.type !== HttpEventType.UploadProgress || typeof event.loaded !== "number") {
        return null;
    }
    return { loaded: event.loaded, total: typeof event.total === "number" ? event.total : undefined };
}

/**
 * Runs an upload function for one file. A promise's result, or an observable's last value, is what the upload
 * returned; for HttpClient's events (`reportProgress: true`, `observe: "events"`), the upload progress events report
 * progress and the response's body is the result. A thrown error, a rejected promise or an observable's error is a
 * failure.
 *
 * The callbacks can run before this returns, since an observable can complete at once.
 *
 * @returns A function that stops the upload: it aborts the context's signal and unsubscribes an observable, and no
 * callback runs after it.
 */
export function runUpload(handler: UploadRunHandler, file: File, callbacks: UploadRunCallbacks): () => void {
    const controller = new AbortController();
    let finished = false;
    let subscription: Subscription | null = null;
    const abort = (): void => {
        if (finished) {
            return;
        }
        finished = true;
        controller.abort();
        subscription?.unsubscribe();
    };
    const succeed = (response: unknown): void => {
        if (!finished) {
            finished = true;
            callbacks.success(response);
        }
    };
    const fail = (error: unknown): void => {
        if (!finished) {
            finished = true;
            callbacks.failure(error);
        }
    };
    const context: UploadRunContext = {
        progress: (loaded: number, total: number = file.size): void => {
            if (!finished && Number.isFinite(loaded) && total > 0) {
                callbacks.progress(Math.min(1, Math.max(0, loaded / total)));
            }
        },
        signal: controller.signal
    };

    let result: Observable<unknown> | Promise<unknown>;
    try {
        result = handler(file, context);
    } catch (error) {
        fail(error);
        return abort;
    }
    if (isObservable(result)) {
        let response: unknown = undefined;
        subscription = result.subscribe({
            complete: () => succeed(response),
            error: (error: unknown) => fail(error),
            next: value => {
                const progress = httpUploadProgress(value);
                if (progress) {
                    context.progress(progress.loaded, progress.total);
                } else if (value instanceof HttpResponse) {
                    response = value.body;
                } else if (!isHttpEventWithoutResult(value)) {
                    response = value;
                }
            }
        });
        if (finished) {
            subscription.unsubscribe();
        }
    } else {
        Promise.resolve(result).then(succeed, fail);
    }
    return abort;
}
