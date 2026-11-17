import type { FileUploadRejection } from "./FileUploadRejection";
import type { FileUploadStatus } from "./FileUploadStatus";

/**
 * A file in the upload's list, and where it stands.
 */
export interface FileUploadItem {
    /** What the upload failed with, while the status is `failed`. */
    readonly error: unknown;

    readonly file: File;

    /**
     * How much of the file has been sent, from 0 to 1, while it uploads. Null until the upload function reports
     * progress, which it may never do.
     */
    readonly progress: number | null;

    /** Why the file wasn't added, while the status is `rejected`. */
    readonly rejection: FileUploadRejection | null;

    /** What the upload function returned for the file, once its status is `uploaded`. */
    readonly response: unknown;

    readonly status: FileUploadStatus;
}
