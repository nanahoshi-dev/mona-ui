import type { Observable } from "rxjs";

/**
 * What the upload function gets with each file.
 */
export interface FileUploadContext {
    /**
     * Reports how much of the file has been sent. `total` defaults to the file's size. HttpClient's upload progress
     * events are read without it.
     */
    progress(loaded: number, total?: number): void;

    /**
     * Aborted when the upload stops early: the file is removed, the list is cleared, the value is replaced or the
     * component is destroyed. Pass it to `fetch`. An observable doesn't need it, since it's unsubscribed instead.
     */
    readonly signal: AbortSignal;
}

/**
 * Uploads one file, and returns a promise or an observable.
 *
 * An observable can be HttpClient's request with `reportProgress: true` and `observe: "events"`: its upload progress
 * events move the progress bar, and its response's body becomes the file's `response`. For any other observable, its
 * last value does. For a promise, what it resolves to does. A rejected promise or an observable's error marks the file
 * `failed`.
 */
export type FileUploadHandler = (file: File, context: FileUploadContext) => Observable<unknown> | Promise<unknown>;
