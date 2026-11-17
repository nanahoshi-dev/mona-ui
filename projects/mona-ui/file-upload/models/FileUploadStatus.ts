/**
 * Where a file in the list stands.
 *
 * - `selected`: added and not uploaded. Without an `upload` function, every file the checks let through stays here.
 *   With one, a file waits here while `autoUpload` is off.
 * - `uploading`: its upload is running.
 * - `uploaded`: its upload finished.
 * - `failed`: its upload failed, and can be retried.
 * - `rejected`: it didn't pass the type, size or count checks. It's listed with the reason, and isn't in the value.
 */
export type FileUploadStatus = "failed" | "rejected" | "selected" | "uploaded" | "uploading";
