import type { QrCodeEncoding } from "../models/QrCodeEncoding";
import type { QrCodeErrorCorrection } from "../models/QrCodeErrorCorrection";
import type { QrCodeValueError } from "../models/QrCodeValueError";
import { encodeText, segmentationBits, segmentBytes, UTF8_ECI } from "./qr-code-segments";
import { dataCapacityBits, MAX_VERSION } from "./qr-code-tables";

/**
 * The settings a value is checked against, matching the component's inputs of the same names.
 */
export interface QrCodeValidationOptions {
    /** Defaults to `"utf-8"`, as on the component. */
    readonly encoding?: QrCodeEncoding;
    /** Defaults to `"M"`, as on the component. */
    readonly errorCorrection?: QrCodeErrorCorrection;
}

/**
 * Checks whether a QR code can hold a value with the given settings, without drawing it: every character has to fit the
 * encoding, and the whole value the largest code. An empty value is valid, since the component draws nothing for it.
 * @param value The text the component would encode.
 * @param options The `encoding` and `errorCorrection` the component uses.
 * @returns Why the value can't be encoded, or `null` when it can.
 */
export function validateQrCodeValue(
    value: string | number,
    options?: QrCodeValidationOptions
): QrCodeValueError | null {
    const encoding = options?.encoding ?? "utf-8";
    const errorCorrection = options?.errorCorrection ?? "M";
    const { bytes, error } = encodeText(String(value ?? ""), encoding);
    if (error) {
        return error;
    }
    const eci = encoding === "utf-8" && bytes.some(byte => byte >= 0x80) ? UTF8_ECI : null;
    const requiredBits = segmentationBits({ eci, segments: segmentBytes(bytes, MAX_VERSION) }, MAX_VERSION);
    const availableBits = dataCapacityBits(MAX_VERSION, errorCorrection);
    return requiredBits > availableBits ? { availableBits, code: "too-long", requiredBits } : null;
}

/** A sentence for a development warning or an export error. */
export function describeQrCodeValueError(error: QrCodeValueError): string {
    switch (error.code) {
        case "unsupported-character":
            return `The encoding can't store "${error.character}" at index ${error.index}. Use encoding "utf-8".`;
        case "too-long":
            return (
                `The value needs ${error.requiredBits} bits, more than the ${error.availableBits} the largest QR code ` +
                `holds at this error correction level. Shorten it or lower errorCorrection.`
            );
    }
}
