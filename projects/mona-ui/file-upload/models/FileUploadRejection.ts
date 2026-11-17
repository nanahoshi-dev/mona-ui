/**
 * Why a file wasn't added: its type isn't in `accept` (`type`), it's larger than `maxFileSize` (`maxFileSize`) or
 * smaller than `minFileSize` (`minFileSize`), or the list already holds as many files as it can (`maxFiles`).
 */
export type FileUploadRejection = "maxFileSize" | "maxFiles" | "minFileSize" | "type";
