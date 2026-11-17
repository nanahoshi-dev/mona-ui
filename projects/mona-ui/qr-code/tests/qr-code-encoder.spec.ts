import { describe, expect, it } from "vitest";
import type { QrCodeErrorCorrection } from "../models/QrCodeErrorCorrection";
import { buildCodewords, encodeQrCode } from "../utils/qr-code-encoder";
import type { QrCodeMatrix } from "../utils/qr-code-matrix";
import { generatorPolynomial } from "../utils/qr-code-reed-solomon";
import { segmentBytes } from "../utils/qr-code-segments";
import {
    alignmentPatternCenters,
    blockLayout,
    dataCapacityBits,
    rawDataModules,
    symbolSize
} from "../utils/qr-code-tables";
import { validateQrCodeValue } from "../utils/validate-qr-code-value";

const LEVELS: readonly QrCodeErrorCorrection[] = ["L", "M", "Q", "H"];

function encode(
    text: string,
    errorCorrection: QrCodeErrorCorrection = "M",
    extra?: { mask?: number; minVersion?: number }
) {
    const result = encodeQrCode(text, { encoding: "utf-8", errorCorrection, ...extra });
    if (!result.matrix) {
        throw new Error(`Expected "${text}" to encode, got ${JSON.stringify(result.error)}`);
    }
    return result.matrix;
}

function moduleAt(matrix: QrCodeMatrix, x: number, y: number): number {
    return matrix.modules[y * matrix.size + x];
}

/** The format information as the top-left copy holds it, most significant bit first. */
function topLeftFormatBits(matrix: QrCodeMatrix): string {
    let bits = "";
    for (let x = 0; x <= 8; x++) {
        if (x !== 6) {
            bits += moduleAt(matrix, x, 8);
        }
    }
    for (let y = 7; y >= 0; y--) {
        if (y !== 6) {
            bits += moduleAt(matrix, 8, y);
        }
    }
    return bits;
}

/** The copy split between the bottom-left and top-right finders. */
function otherFormatBits(matrix: QrCodeMatrix): string {
    let bits = "";
    for (let y = matrix.size - 1; y >= matrix.size - 7; y--) {
        bits += moduleAt(matrix, 8, y);
    }
    for (let x = matrix.size - 8; x < matrix.size; x++) {
        bits += moduleAt(matrix, x, 8);
    }
    return bits;
}

function bytesOf(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

describe("QR code tables", () => {
    it("places alignment patterns where the standard's annex E table does", () => {
        expect(alignmentPatternCenters(1)).toEqual([]);
        expect(alignmentPatternCenters(2)).toEqual([6, 18]);
        expect(alignmentPatternCenters(7)).toEqual([6, 22, 38]);
        expect(alignmentPatternCenters(15)).toEqual([6, 26, 48, 70]);
        expect(alignmentPatternCenters(23)).toEqual([6, 30, 54, 78, 102]);
        expect(alignmentPatternCenters(32)).toEqual([6, 34, 60, 86, 112, 138]);
        expect(alignmentPatternCenters(36)).toEqual([6, 24, 50, 76, 102, 128, 154]);
        expect(alignmentPatternCenters(40)).toEqual([6, 30, 58, 86, 114, 142, 170]);
    });

    it("counts the data modules the drawn function patterns leave, for every version", () => {
        for (let version = 1; version <= 40; version++) {
            // The reserved modules don't depend on the mask, and a fixed one skips scoring all eight.
            const matrix = encode("1", "L", { mask: 0, minVersion: version });
            expect(matrix.version).toBe(version);
            const unreserved = matrix.reserved.reduce((count, reserved) => count + (reserved ? 0 : 1), 0);
            expect(unreserved, `version ${version}`).toBe(rawDataModules(version));
        }
    });

    it("splits every version and level into blocks that add up to its codewords", () => {
        for (let version = 1; version <= 40; version++) {
            for (const level of LEVELS) {
                const layout = blockLayout(version, level);
                expect(layout.totalCodewords).toBe(Math.floor(rawDataModules(version) / 8));
                expect(layout.dataCodewords).toBeGreaterThan(0);
                expect(layout.dataCodewords + layout.blocks * layout.ecCodewordsPerBlock).toBe(layout.totalCodewords);
            }
        }
    });

    it("holds the standard's character capacities at versions 1 and 40", () => {
        // Byte mode: 4 bits of mode and 8 or 16 of count, then 8 bits a character.
        const bytes = (version: number, level: QrCodeErrorCorrection) =>
            Math.floor((dataCapacityBits(version, level) - 4 - (version < 10 ? 8 : 16)) / 8);
        expect(LEVELS.map(level => bytes(1, level))).toEqual([17, 14, 11, 7]);
        expect(LEVELS.map(level => bytes(40, level))).toEqual([2953, 2331, 1663, 1273]);
        expect(symbolSize(1)).toBe(21);
        expect(symbolSize(40)).toBe(177);
    });
});

describe("Reed-Solomon", () => {
    it("builds the standard's generator polynomials", () => {
        expect(Array.from(generatorPolynomial(7))).toEqual([127, 122, 154, 164, 11, 68, 117]);
        expect(Array.from(generatorPolynomial(10))).toEqual([216, 194, 159, 111, 199, 94, 95, 113, 157, 193]);
    });

    it('encodes "01234567" at 1-M as the standard\'s annex I example does', () => {
        const codewords = buildCodewords({ eci: null, segments: segmentBytes(bytesOf("01234567"), 1) }, 1, "M");
        expect(Array.from(codewords)).toEqual([
            16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 165, 36, 212, 193, 237, 54, 199, 135,
            44, 85
        ]);
    });

    it('encodes "HELLO WORLD" at 1-Q in alphanumeric mode', () => {
        const codewords = buildCodewords({ eci: null, segments: segmentBytes(bytesOf("HELLO WORLD"), 1) }, 1, "Q");
        expect(Array.from(codewords)).toEqual([
            32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 168, 72, 22, 82, 217, 54, 156, 0, 46, 15, 180,
            122, 16
        ]);
    });
});

describe("encodeQrCode", () => {
    it("writes the standard's format information, the same in both copies", () => {
        const expected: [QrCodeErrorCorrection, number, string][] = [
            ["L", 0, "111011111000100"],
            ["L", 1, "111001011110011"],
            ["L", 4, "110011000101111"],
            ["M", 0, "101010000010010"],
            ["Q", 0, "011010101011111"],
            ["H", 0, "001011010001001"]
        ];
        for (const [level, mask, bits] of expected) {
            const matrix = encode("1", level, { mask });
            expect(matrix.mask).toBe(mask);
            expect(topLeftFormatBits(matrix)).toBe(bits);
            expect(otherFormatBits(matrix)).toBe(bits);
        }
    });

    it("writes the version information from version 7", () => {
        const matrix = encode("1", "L", { minVersion: 7 });
        let bits = "";
        for (let y = 5; y >= 0; y--) {
            for (let x = matrix.size - 9; x >= matrix.size - 11; x--) {
                bits += moduleAt(matrix, x, y);
            }
        }
        expect(bits).toBe("000111110010010100");
        expect(encode("1", "L", { minVersion: 6 }).reserved[5 * symbolSize(6) + symbolSize(6) - 11]).toBe(0);
    });

    it("draws the finder patterns, timing patterns and the dark module", () => {
        const matrix = encode("Mona UI");
        const ring = [1, 1, 1, 1, 1, 1, 1];
        for (const [left, top] of [
            [0, 0],
            [matrix.size - 7, 0],
            [0, matrix.size - 7]
        ]) {
            expect(ring.map((_, offset) => moduleAt(matrix, left + offset, top))).toEqual(ring);
            expect(moduleAt(matrix, left + 3, top + 3)).toBe(1);
            expect(moduleAt(matrix, left + 1, top + 1)).toBe(0);
        }
        for (let index = 8; index < matrix.size - 8; index++) {
            expect(moduleAt(matrix, index, 6)).toBe(index % 2 === 0 ? 1 : 0);
            expect(moduleAt(matrix, 6, index)).toBe(index % 2 === 0 ? 1 : 0);
        }
        expect(moduleAt(matrix, 8, matrix.size - 8)).toBe(1);
    });

    it("draws the same symbol for the same input", () => {
        // Checked against an independent decoder when it was recorded.
        const matrix = encode("Mona UI");
        let hex = "";
        for (let index = 0; index < matrix.modules.length; index += 4) {
            let nibble = 0;
            for (let bit = 0; bit < 4; bit++) {
                nibble = (nibble << 1) | (matrix.modules[index + bit] ?? 0);
            }
            hex += nibble.toString(16);
        }
        expect(matrix.version).toBe(1);
        expect(matrix.mask).toBe(2);
        expect(hex).toBe(
            "fe4bfc10506eb6bb75a5dba8aec17907faafe01c00be13e6a6fa64bad4cafce1b2998054a3f8d050580fbab415d6f12eba99047e4fea910"
        );
    });

    it("chooses the smallest version that holds the value", () => {
        // The version is chosen before the mask, and a fixed one skips scoring all eight on the large symbols.
        const versionOf = (text: string) => encode(text, "L", { mask: 0 }).version;
        expect(versionOf("a".repeat(17))).toBe(1);
        expect(versionOf("a".repeat(18))).toBe(2);
        expect(versionOf("a".repeat(2953))).toBe(40);
        expect(versionOf("1".repeat(7089))).toBe(40);
        expect(versionOf("A".repeat(4296))).toBe(40);
    });

    it("stores digits and uppercase in their denser modes", () => {
        // 41 numeric digits fit version 1-L, which holds only 17 bytes.
        expect(encode("1".repeat(41), "L").version).toBe(1);
        expect(encode("A".repeat(25), "L").version).toBe(1);
        expect(encode("a".repeat(25), "L").version).toBe(2);
    });

    it("splits a value into modes where switching saves bits", () => {
        const segments = segmentBytes(bytesOf("order-id:12345678901234567890"), 1);
        expect(segments.map(segment => segment.mode)).toEqual(["byte", "numeric"]);
        expect(new TextDecoder().decode(segments[1].bytes)).toBe("12345678901234567890");
        expect(segmentBytes(bytesOf("hello"), 1).map(segment => segment.mode)).toEqual(["byte"]);
    });

    it("starts a UTF-8 value outside ASCII with the ECI header that names UTF-8", () => {
        // Version 1-L holds 17 bytes, or 16 after the header's 12 bits.
        expect(encode("a".repeat(17), "L").version).toBe(1);
        expect(encode("é".repeat(8), "L").version).toBe(1);
        expect(encode(`${"é".repeat(8)}a`, "L").version).toBe(2);
        // The ECI mode indicator 0111, then designator 26 in one byte.
        const codewords = buildCodewords({ eci: 26, segments: segmentBytes(bytesOf("ü"), 1) }, 1, "M");
        expect(codewords[0]).toBe(0b0111_0001);
        expect(codewords[1] >> 4).toBe(0b1010);
    });

    it("stores Latin-1 as single bytes and refuses characters beyond it", () => {
        const latin1 = encodeQrCode("café", { encoding: "iso-8859-1", errorCorrection: "M" });
        expect(latin1.matrix?.version).toBe(1);
        expect(encodeQrCode("price: 5 €", { encoding: "iso-8859-1", errorCorrection: "M" }).error).toEqual({
            character: "€",
            code: "unsupported-character",
            index: 9
        });
    });

    it("reports a value too long for version 40", () => {
        expect(encodeQrCode("a".repeat(2954), { encoding: "utf-8", errorCorrection: "L" }).error).toEqual({
            availableBits: 23648,
            code: "too-long",
            requiredBits: 23652
        });
    });
});

describe("validateQrCodeValue", () => {
    it("accepts what the component can draw, an empty value included", () => {
        expect(validateQrCodeValue("https://nanahoshi.dev")).toBeNull();
        expect(validateQrCodeValue("")).toBeNull();
        expect(validateQrCodeValue(12345)).toBeNull();
        expect(validateQrCodeValue("a".repeat(2331))).toBeNull();
    });

    it("agrees with the encoder on what's too long at each level", () => {
        expect(validateQrCodeValue("a".repeat(2332))?.code).toBe("too-long");
        expect(validateQrCodeValue("a".repeat(2953), { errorCorrection: "L" })).toBeNull();
        expect(validateQrCodeValue("a".repeat(1274), { errorCorrection: "H" })).toEqual(
            encodeQrCode("a".repeat(1274), { encoding: "utf-8", errorCorrection: "H" }).error
        );
    });

    it("reports the first character Latin-1 can't hold", () => {
        expect(validateQrCodeValue("naïve 日本", { encoding: "iso-8859-1" })).toEqual({
            character: "日",
            code: "unsupported-character",
            index: 6
        });
        expect(validateQrCodeValue("😀", { encoding: "iso-8859-1" })).toMatchObject({ character: "😀", index: 0 });
    });
});
