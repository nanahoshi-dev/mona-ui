/**
 * The character set a QR code stores text in.
 * - `"utf-8"`: any text. A value with characters outside ASCII starts with an ECI header that tells readers it's UTF-8.
 * - `"iso-8859-1"`: Latin-1 only, which every reader assumes when there's no header. Other characters are an error.
 */
export type QrCodeEncoding = "utf-8" | "iso-8859-1";
