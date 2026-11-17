/**
 * A character the chosen encoding can't store, such as `€` in `"iso-8859-1"`.
 */
export interface QrCodeUnsupportedCharacterError {
    /** The first character that can't be stored. */
    readonly character: string;
    readonly code: "unsupported-character";
    /** Where that character starts in the value, in UTF-16 code units. */
    readonly index: number;
}

/**
 * A value too long for the largest QR code (version 40) at the chosen error correction level.
 */
export interface QrCodeTooLongError {
    /** The most bits a version 40 code holds at the chosen error correction level. */
    readonly availableBits: number;
    readonly code: "too-long";
    /** The bits the value needs. */
    readonly requiredBits: number;
}

/**
 * Why a value can't be stored in a QR code.
 */
export type QrCodeValueError = QrCodeUnsupportedCharacterError | QrCodeTooLongError;
