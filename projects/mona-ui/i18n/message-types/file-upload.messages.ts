/**
 * The file upload's drop zone, its list of files, and what it announces as files are added, uploaded and removed.
 */
export interface MonaFileUploadMessages {
    /** The browse button's text, when several files can be added. */
    readonly browse: string;

    /** The browse button's text, when one file can be added. */
    readonly browseFile: string;

    /** Name of the button that stops a file's upload and removes it. */
    cancel(name: string): string;

    /** Text of the button that removes every file, shown with the upload button while `autoUpload` is off. */
    readonly clear: string;

    /** The drop zone's text, when one file can be added. */
    readonly dropFile: string;

    /** The drop zone's text, when several files can be added. */
    readonly dropFiles: string;

    /** The drop zone's text while files are dragged over it. */
    readonly dropToAdd: string;

    /** Announced when a file's upload fails. */
    fileFailed(name: string): string;

    /** Announced for a file that wasn't added, with the reason, which is one of the rejection messages. */
    fileRejected(name: string, reason: string): string;

    /** Announced when a file is removed. */
    fileRemoved(name: string): string;

    /** The accepted types under the drop zone, as a list such as "PDF, PNG or JPG". */
    fileTypes(types: string): string;

    /** Announced when a file's upload finishes. */
    fileUploaded(name: string): string;

    /** Name of the list of files. */
    readonly files: string;

    /** Announced when files are added. */
    filesAdded(count: number): string;

    /** Why a file of a type `accept` doesn't list wasn't added. */
    readonly invalidType: string;

    /** The largest file size under the drop zone, formatted in the locale. */
    maxFileSize(size: string): string;

    /** The most files under the drop zone. */
    maxFiles(count: number): string;

    /** A file's status while it waits for the upload button. */
    readonly readyToUpload: string;

    /** Name of the button that removes a file. */
    remove(name: string): string;

    /** Name of the button that uploads a failed file again. */
    retry(name: string): string;

    /** Why a file larger than `maxFileSize` wasn't added, with the size formatted in the locale. */
    tooLarge(size: string): string;

    /** Why a file past `maxFiles` wasn't added. */
    tooMany(count: number): string;

    /** Why a file smaller than `minFileSize` wasn't added, with the size formatted in the locale. */
    tooSmall(size: string): string;

    /** Text of the button that uploads the waiting files, while `autoUpload` is off. */
    readonly upload: string;

    /** A file's status when its upload failed. */
    readonly uploadFailed: string;

    /** A file's status once it's uploaded. */
    readonly uploaded: string;

    /** A file's status while it uploads. */
    readonly uploading: string;
}
