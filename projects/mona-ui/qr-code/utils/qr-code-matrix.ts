import type { QrCodeErrorCorrection } from "../models/QrCodeErrorCorrection";
import { alignmentPatternCenters, FORMAT_LEVEL_BITS, symbolSize } from "./qr-code-tables";

/** A drawn QR code symbol, without its quiet zone. */
export interface QrCodeMatrix {
    /**
     * For each module, the index of the codeword whose bit it holds in the interleaved sequence, or -1 for function
     * patterns and remainder bits.
     */
    readonly codewordIndices: Int16Array;
    readonly errorCorrection: QrCodeErrorCorrection;
    /** The mask pattern, 0 to 7. */
    readonly mask: number;
    /** 1 for a dark module, row by row. */
    readonly modules: Uint8Array;
    /** 1 for a module of a function pattern: finders, separators, timing, alignment, format and version information. */
    readonly reserved: Uint8Array;
    /** Modules on each side. */
    readonly size: number;
    readonly version: number;
}

const FORMAT_GENERATOR = 0x537;
const FORMAT_XOR_MASK = 0x5412;
const VERSION_GENERATOR = 0x1f25;

const PENALTY_RUN = 3;
const PENALTY_BLOCK = 3;
const PENALTY_FINDER_LIKE = 40;
const PENALTY_BALANCE = 10;

type MaskPredicate = (x: number, y: number) => boolean;

/** The eight mask patterns (table 10 of the standard). A module is inverted where its predicate holds. */
const MASKS: readonly MaskPredicate[] = [
    (x, y) => (x + y) % 2 === 0,
    (_, y) => y % 2 === 0,
    x => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
];

/** The light-dark pattern of a finder pattern's middle row with four light modules on one side, as a scan meets it. */
const FINDER_LIKE_PATTERNS: readonly (readonly number[])[] = [
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]
];

/**
 * Draws the symbol for interleaved codewords: the function patterns, the data in the standard's zigzag, and the mask
 * with the lowest penalty, unless one is given.
 */
export function buildQrCodeMatrix(
    version: number,
    errorCorrection: QrCodeErrorCorrection,
    codewords: Uint8Array,
    forcedMask?: number
): QrCodeMatrix {
    const size = symbolSize(version);
    const modules = new Uint8Array(size * size);
    const reserved = new Uint8Array(size * size);
    const codewordIndices = new Int16Array(size * size).fill(-1);
    const set = (x: number, y: number, dark: boolean) => {
        modules[y * size + x] = dark ? 1 : 0;
        reserved[y * size + x] = 1;
    };

    drawFunctionPatterns(size, version, set);
    placeCodewords(size, codewords, modules, reserved, codewordIndices);

    let mask = forcedMask ?? -1;
    if (mask < 0) {
        let lowestPenalty = Infinity;
        MASKS.forEach((_, candidate) => {
            drawFormatBits(size, errorCorrection, candidate, set);
            applyMask(size, candidate, modules, reserved);
            const penalty = maskPenalty(size, modules);
            applyMask(size, candidate, modules, reserved);
            if (penalty < lowestPenalty) {
                lowestPenalty = penalty;
                mask = candidate;
            }
        });
    }
    drawFormatBits(size, errorCorrection, mask, set);
    applyMask(size, mask, modules, reserved);

    return { codewordIndices, errorCorrection, mask, modules, reserved, size, version };
}

function applyMask(size: number, mask: number, modules: Uint8Array, reserved: Uint8Array): void {
    const predicate = MASKS[mask];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const index = y * size + x;
            if (!reserved[index] && predicate(x, y)) {
                modules[index] ^= 1;
            }
        }
    }
}

function drawFormatBits(
    size: number,
    errorCorrection: QrCodeErrorCorrection,
    mask: number,
    set: (x: number, y: number, dark: boolean) => void
): void {
    const data = (FORMAT_LEVEL_BITS[errorCorrection] << 3) | mask;
    const bits = ((data << 10) | bchRemainder(data, FORMAT_GENERATOR, 10)) ^ FORMAT_XOR_MASK;
    const bit = (index: number) => ((bits >>> index) & 1) === 1;

    // Around the top-left finder pattern, stepping over the timing patterns.
    for (let index = 0; index <= 5; index++) {
        set(8, index, bit(index));
    }
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let index = 9; index < 15; index++) {
        set(14 - index, 8, bit(index));
    }

    // The copy split between the top-right and bottom-left finder patterns.
    for (let index = 0; index < 8; index++) {
        set(size - 1 - index, 8, bit(index));
    }
    for (let index = 8; index < 15; index++) {
        set(8, size - 15 + index, bit(index));
    }
    // The dark module, always dark, beside the bottom-left copy.
    set(8, size - 8, true);
}

function drawFunctionPatterns(size: number, version: number, set: (x: number, y: number, dark: boolean) => void): void {
    for (let index = 0; index < size; index++) {
        set(6, index, index % 2 === 0);
        set(index, 6, index % 2 === 0);
    }

    // Finder patterns with their separators: rings of dark, light, dark from the center out, then a light border.
    for (const [centerX, centerY] of [
        [3, 3],
        [size - 4, 3],
        [3, size - 4]
    ]) {
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x >= 0 && x < size && y >= 0 && y < size) {
                    const ring = Math.max(Math.abs(dx), Math.abs(dy));
                    set(x, y, ring !== 2 && ring !== 4);
                }
            }
        }
    }

    const centers = alignmentPatternCenters(version);
    const last = centers.length - 1;
    centers.forEach((centerY, row) => {
        centers.forEach((centerX, column) => {
            const underFinder =
                (row === 0 && column === 0) || (row === 0 && column === last) || (row === last && column === 0);
            if (underFinder) {
                return;
            }
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    set(centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
                }
            }
        });
    });

    // Reserve the format information. drawFormatBits writes it once the mask is chosen.
    drawFormatBits(size, "L", 0, set);

    if (version >= 7) {
        const bits = (version << 12) | bchRemainder(version, VERSION_GENERATOR, 12);
        for (let index = 0; index < 18; index++) {
            const dark = ((bits >>> index) & 1) === 1;
            const along = size - 11 + (index % 3);
            const across = Math.floor(index / 3);
            set(along, across, dark);
            set(across, along, dark);
        }
    }
}

/** The remainder of value · x^degree divided by a generator, for the BCH codes of the format and version information. */
function bchRemainder(value: number, generator: number, degree: number): number {
    let remainder = value;
    for (let step = 0; step < degree; step++) {
        remainder = (remainder << 1) ^ ((remainder >>> (degree - 1)) * generator);
    }
    return remainder & ((1 << degree) - 1);
}

/**
 * The penalty the standard scores a masked symbol with: runs of five or more modules of one color, 2×2 blocks of one
 * color, patterns that look like a finder pattern, and an imbalance between dark and light.
 */
function maskPenalty(size: number, modules: Uint8Array): number {
    let penalty = 0;
    let dark = 0;
    const line = new Uint8Array(size);
    for (let direction = 0; direction < 2; direction++) {
        for (let outer = 0; outer < size; outer++) {
            for (let inner = 0; inner < size; inner++) {
                line[inner] = direction === 0 ? modules[outer * size + inner] : modules[inner * size + outer];
            }
            penalty += runPenalty(line) + finderLikePenalty(line);
        }
    }
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const color = modules[y * size + x];
            dark += color;
            if (
                x < size - 1 &&
                y < size - 1 &&
                color === modules[y * size + x + 1] &&
                color === modules[(y + 1) * size + x] &&
                color === modules[(y + 1) * size + x + 1]
            ) {
                penalty += PENALTY_BLOCK;
            }
        }
    }
    const total = size * size;
    // 10 points for every full 5% the dark share is away from 50%.
    penalty += Math.floor(Math.abs(dark * 20 - total * 10) / total) * PENALTY_BALANCE;
    return penalty;
}

function finderLikePenalty(line: Uint8Array): number {
    let penalty = 0;
    // The quiet zone around the symbol counts as light.
    const at = (index: number) => (index >= 0 && index < line.length ? line[index] : 0);
    for (let start = -4; start + 11 <= line.length + 4; start++) {
        for (const pattern of FINDER_LIKE_PATTERNS) {
            if (pattern.every((color, offset) => at(start + offset) === color)) {
                penalty += PENALTY_FINDER_LIKE;
            }
        }
    }
    return penalty;
}

/**
 * Writes the codewords' bits in two-module-wide columns from the bottom right, up and down in turn, skipping the
 * vertical timing pattern and every reserved module. Modules left over are the remainder bits and stay light.
 */
function placeCodewords(
    size: number,
    codewords: Uint8Array,
    modules: Uint8Array,
    reserved: Uint8Array,
    codewordIndices: Int16Array
): void {
    const totalBits = codewords.length * 8;
    let bitIndex = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) {
            right = 5;
        }
        const upward = ((right + 1) & 2) === 0;
        for (let step = 0; step < size; step++) {
            const y = upward ? size - 1 - step : step;
            for (let offset = 0; offset < 2; offset++) {
                const index = y * size + right - offset;
                if (reserved[index] || bitIndex >= totalBits) {
                    continue;
                }
                const codeword = bitIndex >>> 3;
                modules[index] = (codewords[codeword] >>> (7 - (bitIndex & 7))) & 1;
                codewordIndices[index] = codeword;
                bitIndex++;
            }
        }
    }
}

function runPenalty(line: Uint8Array): number {
    let penalty = 0;
    let runLength = 1;
    for (let index = 1; index <= line.length; index++) {
        if (index < line.length && line[index] === line[index - 1]) {
            runLength++;
            continue;
        }
        if (runLength >= 5) {
            penalty += PENALTY_RUN + runLength - 5;
        }
        runLength = 1;
    }
    return penalty;
}
