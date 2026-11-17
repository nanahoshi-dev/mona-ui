import type { QrCodeEncoding } from "../models/QrCodeEncoding";
import type { QrCodeUnsupportedCharacterError } from "../models/QrCodeValueError";

export type QrCodeSegmentMode = "alphanumeric" | "byte" | "numeric";

/** A run of the value stored in one mode. */
export interface QrCodeSegment {
    readonly bytes: Uint8Array;
    readonly mode: QrCodeSegmentMode;
}

/** The value split into segments, with the ECI designator to write before them, if any. */
export interface QrCodeSegmentation {
    readonly eci: number | null;
    readonly segments: readonly QrCodeSegment[];
}

export const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

/** The ECI assignment number of UTF-8. */
export const UTF8_ECI = 26;

const MODES: readonly QrCodeSegmentMode[] = ["numeric", "alphanumeric", "byte"];

const MODE_INDICATORS: Readonly<Record<QrCodeSegmentMode, number>> = {
    alphanumeric: 0b0010,
    byte: 0b0100,
    numeric: 0b0001
};

export const ECI_MODE_INDICATOR = 0b0111;

/**
 * Bits of a character's cost in each mode, times 6 so that numeric's 10 bits per 3 digits and alphanumeric's 11 bits
 * per 2 characters stay whole numbers.
 */
const SCALED_CHARACTER_COST: Readonly<Record<QrCodeSegmentMode, number>> = { alphanumeric: 33, byte: 48, numeric: 20 };

const ALPHANUMERIC_VALUES = new Map(
    [...ALPHANUMERIC_CHARSET].map((character, index) => [character.charCodeAt(0), index])
);

const utf8Encoder = new TextEncoder();

/** Appends bits to a growing buffer, most significant first. */
export class QrCodeBitBuffer {
    #bits: number[] = [];

    public get length(): number {
        return this.#bits.length;
    }

    public append(value: number, length: number): void {
        for (let bit = length - 1; bit >= 0; bit--) {
            this.#bits.push((value >>> bit) & 1);
        }
    }

    public toBytes(): Uint8Array {
        const bytes = new Uint8Array(Math.ceil(this.#bits.length / 8));
        this.#bits.forEach((bit, index) => {
            bytes[index >>> 3] |= bit << (7 - (index & 7));
        });
        return bytes;
    }
}

/** The bits of a segment's character count indicator, which grow with the version. */
export function characterCountBits(mode: QrCodeSegmentMode, version: number): number {
    const tier = version <= 9 ? 0 : version <= 26 ? 1 : 2;
    switch (mode) {
        case "numeric":
            return [10, 12, 14][tier];
        case "alphanumeric":
            return [9, 11, 13][tier];
        case "byte":
            return [8, 16, 16][tier];
    }
}

/**
 * The value as bytes in the encoding, or the first character the encoding can't hold. ASCII is the same in both, so the
 * numeric and alphanumeric characters are single bytes either way. It's a tagged result rather than a check for
 * `Uint8Array`, which fails for `TextEncoder`'s arrays where they come from another realm, as under jsdom.
 */
export function encodeText(
    text: string,
    encoding: QrCodeEncoding
):
    | { readonly bytes: Uint8Array; readonly error?: never }
    | { readonly bytes?: never; readonly error: QrCodeUnsupportedCharacterError } {
    if (encoding === "utf-8") {
        return { bytes: utf8Encoder.encode(text) };
    }
    const bytes = new Uint8Array(text.length);
    for (let index = 0; index < text.length; index++) {
        const code = text.charCodeAt(index);
        if (code > 0xff) {
            const codePoint = text.codePointAt(index) ?? code;
            return { error: { character: String.fromCodePoint(codePoint), code: "unsupported-character", index } };
        }
        bytes[index] = code;
    }
    return { bytes };
}

/**
 * Splits the bytes into numeric, alphanumeric and byte segments with the fewest bits for a version's character count
 * widths, by dynamic programming over the mode each byte ends in.
 */
export function segmentBytes(bytes: Uint8Array, version: number): QrCodeSegment[] {
    if (bytes.length === 0) {
        return [];
    }
    const headerCost = (mode: QrCodeSegmentMode) => (4 + characterCountBits(mode, version)) * 6;
    // The previous mode that led to each byte's cheapest cost in each mode.
    const previous: Int8Array[] = [];
    let costs = MODES.map(mode => headerCost(mode));
    for (let index = 0; index < bytes.length; index++) {
        const byte = bytes[index];
        const next = [Infinity, Infinity, Infinity];
        const from = new Int8Array(3).fill(-1);
        MODES.forEach((mode, modeIndex) => {
            if (!fitsMode(byte, mode)) {
                return;
            }
            MODES.forEach((_, fromIndex) => {
                // Starting a new segment ends the last one on a whole bit.
                const cost =
                    fromIndex === modeIndex ? costs[fromIndex] : Math.ceil(costs[fromIndex] / 6) * 6 + headerCost(mode);
                if (cost < next[modeIndex]) {
                    next[modeIndex] = cost;
                    from[modeIndex] = fromIndex;
                }
            });
            next[modeIndex] += SCALED_CHARACTER_COST[mode];
        });
        previous.push(from);
        costs = next;
    }

    let modeIndex = costs.indexOf(Math.min(...costs));
    const modes = new Array<number>(bytes.length);
    for (let index = bytes.length - 1; index >= 0; index--) {
        modes[index] = modeIndex;
        modeIndex = previous[index][modeIndex];
    }

    const segments: QrCodeSegment[] = [];
    let start = 0;
    for (let index = 1; index <= bytes.length; index++) {
        if (index === bytes.length || modes[index] !== modes[start]) {
            segments.push({ bytes: bytes.subarray(start, index), mode: MODES[modes[start]] });
            start = index;
        }
    }
    return segments;
}

/** The bits the segments take at a version, headers included. */
export function segmentationBits(segmentation: QrCodeSegmentation, version: number): number {
    let bits = segmentation.eci === null ? 0 : 4 + 8;
    for (const segment of segmentation.segments) {
        bits += 4 + characterCountBits(segment.mode, version) + segmentDataBits(segment);
    }
    return bits;
}

export function writeSegments(buffer: QrCodeBitBuffer, segmentation: QrCodeSegmentation, version: number): void {
    if (segmentation.eci !== null) {
        // Assignment numbers below 128 take one byte.
        buffer.append(ECI_MODE_INDICATOR, 4);
        buffer.append(segmentation.eci, 8);
    }
    for (const segment of segmentation.segments) {
        buffer.append(MODE_INDICATORS[segment.mode], 4);
        buffer.append(segment.bytes.length, characterCountBits(segment.mode, version));
        writeSegmentData(buffer, segment);
    }
}

function fitsMode(byte: number, mode: QrCodeSegmentMode): boolean {
    switch (mode) {
        case "numeric":
            return byte >= 0x30 && byte <= 0x39;
        case "alphanumeric":
            return ALPHANUMERIC_VALUES.has(byte);
        case "byte":
            return true;
    }
}

function segmentDataBits(segment: QrCodeSegment): number {
    const count = segment.bytes.length;
    switch (segment.mode) {
        case "numeric":
            return Math.floor(count / 3) * 10 + [0, 4, 7][count % 3];
        case "alphanumeric":
            return Math.floor(count / 2) * 11 + (count % 2) * 6;
        case "byte":
            return count * 8;
    }
}

function writeSegmentData(buffer: QrCodeBitBuffer, segment: QrCodeSegment): void {
    const { bytes } = segment;
    switch (segment.mode) {
        case "numeric":
            for (let index = 0; index < bytes.length; index += 3) {
                const group = bytes.subarray(index, index + 3);
                const value = group.reduce((total, byte) => total * 10 + (byte - 0x30), 0);
                buffer.append(value, [0, 4, 7, 10][group.length]);
            }
            return;
        case "alphanumeric":
            for (let index = 0; index < bytes.length; index += 2) {
                const first = ALPHANUMERIC_VALUES.get(bytes[index]) ?? 0;
                if (index + 1 < bytes.length) {
                    buffer.append(first * 45 + (ALPHANUMERIC_VALUES.get(bytes[index + 1]) ?? 0), 11);
                } else {
                    buffer.append(first, 6);
                }
            }
            return;
        case "byte":
            for (const byte of bytes) {
                buffer.append(byte, 8);
            }
            return;
    }
}
