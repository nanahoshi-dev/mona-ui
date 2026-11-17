import type { QrCodeEncoding } from "../models/QrCodeEncoding";
import type { QrCodeErrorCorrection } from "../models/QrCodeErrorCorrection";
import type { QrCodeValueError } from "../models/QrCodeValueError";
import { buildQrCodeMatrix, type QrCodeMatrix } from "./qr-code-matrix";
import { reedSolomonRemainder } from "./qr-code-reed-solomon";
import {
    encodeText,
    QrCodeBitBuffer,
    type QrCodeSegmentation,
    segmentationBits,
    segmentBytes,
    UTF8_ECI,
    writeSegments
} from "./qr-code-segments";
import { blockLayout, dataCapacityBits, MAX_VERSION, MIN_VERSION } from "./qr-code-tables";

export interface QrCodeEncodeOptions {
    readonly encoding: QrCodeEncoding;
    readonly errorCorrection: QrCodeErrorCorrection;
    /** A mask pattern to use instead of the one with the lowest penalty, for tests that compare with the standard. */
    readonly mask?: number;
    /** The smallest version to use, such as one with room for an overlay. */
    readonly minVersion?: number;
}

export type QrCodeEncodeResult =
    | { readonly error: QrCodeValueError; readonly matrix?: never }
    | { readonly error?: never; readonly matrix: QrCodeMatrix };

const PAD_BYTES = [0xec, 0x11];

/** Encodes text as the smallest QR code that holds it at the error correction level. */
export function encodeQrCode(text: string, options: QrCodeEncodeOptions): QrCodeEncodeResult {
    const { encoding, errorCorrection } = options;
    const { bytes, error } = encodeText(text, encoding);
    if (error) {
        return { error };
    }
    // ASCII reads the same in every encoding, so only other bytes need the header that names UTF-8.
    const eci = encoding === "utf-8" && bytes.some(byte => byte >= 0x80) ? UTF8_ECI : null;

    let requiredBits = 0;
    for (let version = Math.max(MIN_VERSION, options.minVersion ?? MIN_VERSION); version <= MAX_VERSION; version++) {
        const segmentation: QrCodeSegmentation = { eci, segments: segmentBytes(bytes, version) };
        requiredBits = segmentationBits(segmentation, version);
        if (requiredBits <= dataCapacityBits(version, errorCorrection)) {
            const codewords = buildCodewords(segmentation, version, errorCorrection);
            return { matrix: buildQrCodeMatrix(version, errorCorrection, codewords, options.mask) };
        }
    }
    return {
        error: { availableBits: dataCapacityBits(MAX_VERSION, errorCorrection), code: "too-long", requiredBits }
    };
}

/**
 * The data codewords for the segments, terminated and padded to the version's capacity, then split into blocks with
 * their error correction codewords and interleaved.
 */
export function buildCodewords(
    segmentation: QrCodeSegmentation,
    version: number,
    errorCorrection: QrCodeErrorCorrection
): Uint8Array {
    const layout = blockLayout(version, errorCorrection);
    const capacityBits = layout.dataCodewords * 8;

    const buffer = new QrCodeBitBuffer();
    writeSegments(buffer, segmentation, version);
    buffer.append(0, Math.min(4, capacityBits - buffer.length));
    buffer.append(0, (8 - (buffer.length % 8)) % 8);
    const data = new Uint8Array(layout.dataCodewords);
    data.set(buffer.toBytes());
    for (let index = buffer.length / 8; index < data.length; index++) {
        data[index] = PAD_BYTES[(index - buffer.length / 8) % 2];
    }

    // The first blocks are a codeword shorter than the rest.
    const longBlocks = layout.totalCodewords % layout.blocks;
    const shortBlocks = layout.blocks - longBlocks;
    const shortDataLength = Math.floor(layout.totalCodewords / layout.blocks) - layout.ecCodewordsPerBlock;
    const dataBlocks: Uint8Array[] = [];
    const ecBlocks: Uint8Array[] = [];
    let offset = 0;
    for (let block = 0; block < layout.blocks; block++) {
        const length = shortDataLength + (block < shortBlocks ? 0 : 1);
        const blockData = data.subarray(offset, offset + length);
        dataBlocks.push(blockData);
        ecBlocks.push(reedSolomonRemainder(blockData, layout.ecCodewordsPerBlock));
        offset += length;
    }

    const codewords = new Uint8Array(layout.totalCodewords);
    let position = 0;
    for (let index = 0; index <= shortDataLength; index++) {
        for (const block of dataBlocks) {
            if (index < block.length) {
                codewords[position++] = block[index];
            }
        }
    }
    for (let index = 0; index < layout.ecCodewordsPerBlock; index++) {
        for (const block of ecBlocks) {
            codewords[position++] = block[index];
        }
    }
    return codewords;
}

/**
 * The block each codeword of the interleaved sequence belongs to, for counting how many codewords of each block an
 * overlay hides.
 */
export function codewordBlocks(version: number, errorCorrection: QrCodeErrorCorrection): Uint8Array {
    const layout = blockLayout(version, errorCorrection);
    const longBlocks = layout.totalCodewords % layout.blocks;
    const shortBlocks = layout.blocks - longBlocks;
    const shortDataLength = Math.floor(layout.totalCodewords / layout.blocks) - layout.ecCodewordsPerBlock;
    const blocks = new Uint8Array(layout.totalCodewords);
    let position = 0;
    for (let index = 0; index <= shortDataLength; index++) {
        for (let block = 0; block < layout.blocks; block++) {
            if (index < shortDataLength + (block < shortBlocks ? 0 : 1)) {
                blocks[position++] = block;
            }
        }
    }
    for (let index = 0; index < layout.ecCodewordsPerBlock; index++) {
        for (let block = 0; block < layout.blocks; block++) {
            blocks[position++] = block;
        }
    }
    return blocks;
}
