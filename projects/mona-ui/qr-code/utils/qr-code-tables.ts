import type { QrCodeErrorCorrection } from "../models/QrCodeErrorCorrection";

/*
 * Constants from ISO/IEC 18004, the QR code standard. Each per-version table is indexed by version, so index 0 is unused.
 */

export const MIN_VERSION = 1;
export const MAX_VERSION = 40;

/** Error correction codewords in each block (table 9 of the standard). */
const EC_CODEWORDS_PER_BLOCK: Readonly<Record<QrCodeErrorCorrection, readonly number[]>> = {
    L: [
        0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30,
        30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30
    ],
    M: [
        0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28,
        28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
    ],
    Q: [
        0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30,
        30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30
    ],
    H: [
        0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30,
        30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30
    ]
};

/** Error correction blocks the codewords are split into (table 9 of the standard). */
const EC_BLOCKS: Readonly<Record<QrCodeErrorCorrection, readonly number[]>> = {
    L: [
        0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18,
        19, 19, 20, 21, 22, 24, 25
    ],
    M: [
        0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31,
        33, 35, 37, 38, 40, 43, 45, 47, 49
    ],
    Q: [
        0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40,
        43, 45, 48, 51, 53, 56, 59, 62, 65, 68
    ],
    H: [
        0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48,
        51, 54, 57, 60, 63, 66, 70, 74, 77, 81
    ]
};

/** The two bits that name each level in the format information. */
export const FORMAT_LEVEL_BITS: Readonly<Record<QrCodeErrorCorrection, number>> = { L: 1, M: 0, Q: 3, H: 2 };

export interface QrCodeBlockLayout {
    readonly blocks: number;
    readonly dataCodewords: number;
    readonly ecCodewordsPerBlock: number;
    /**
     * Codewords of each block held back from correction to guard against misreading (table 9's `p`), which only the
     * smallest versions have.
     */
    readonly misdecodeProtection: number;
    readonly totalCodewords: number;
}

/** The width and height of a symbol, in modules, without the quiet zone. */
export function symbolSize(version: number): number {
    return version * 4 + 17;
}

/**
 * The modules left for data and error correction once the function patterns are drawn, including the few remainder
 * bits that don't make up a whole codeword.
 */
export function rawDataModules(version: number): number {
    const size = symbolSize(version);
    // Three finder patterns with their separators, the two timing patterns, the format information and the dark module.
    let modules = size * size - 3 * 64 - 2 * (size - 16) - 31;
    const alignmentCount = alignmentPatternCenters(version).length;
    if (alignmentCount > 0) {
        // Every alignment pattern but the three under the finders. Those on the timing rows share five modules with it.
        const patterns = alignmentCount * alignmentCount - 3;
        const onTiming = 2 * (alignmentCount - 2);
        modules -= patterns * 25 - onTiming * 5;
    }
    if (version >= 7) {
        modules -= 2 * 18;
    }
    return modules;
}

/**
 * The row and column centers of the alignment patterns (annex E of the standard). The patterns sit at every pairing of
 * them, except the three corners the finder patterns take.
 */
export function alignmentPatternCenters(version: number): number[] {
    if (version === 1) {
        return [];
    }
    const count = Math.floor(version / 7) + 2;
    const last = symbolSize(version) - 7;
    // The centers between 6 and the last one are evenly spaced by an even step, counted back from the last. Version 32
    // is the one exception the standard's table makes to that rule.
    const step = version === 32 ? 26 : Math.ceil((last - 6) / (count - 1) / 2) * 2;
    const centers = [6];
    for (let index = count - 2; index >= 0; index--) {
        centers.push(last - index * step);
    }
    return centers;
}

export function blockLayout(version: number, level: QrCodeErrorCorrection): QrCodeBlockLayout {
    const blocks = EC_BLOCKS[level][version];
    const ecCodewordsPerBlock = EC_CODEWORDS_PER_BLOCK[level][version];
    const totalCodewords = Math.floor(rawDataModules(version) / 8);
    return {
        blocks,
        dataCodewords: totalCodewords - blocks * ecCodewordsPerBlock,
        ecCodewordsPerBlock,
        misdecodeProtection: misdecodeProtection(version, level),
        totalCodewords
    };
}

/** The bits of data a version holds at a level. */
export function dataCapacityBits(version: number, level: QrCodeErrorCorrection): number {
    return blockLayout(version, level).dataCodewords * 8;
}

function misdecodeProtection(version: number, level: QrCodeErrorCorrection): number {
    if (version === 1) {
        return level === "L" ? 3 : level === "M" ? 2 : 1;
    }
    if (version === 2 && level === "L") {
        return 2;
    }
    if (version === 3 && level === "L") {
        return 1;
    }
    return 0;
}
