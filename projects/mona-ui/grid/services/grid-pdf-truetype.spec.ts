import { describe, expect, it } from "vitest";
import { parseTrueTypeFont } from "./grid-pdf-truetype";
import { createTestCollection, createTestFont } from "./testing/create-test-font";

const A = 0x41;
const B = 0x42;
const HAN = 0x6f22;
const EMOJI = 0x1f600;

/** Glyphs: 1 = A, 2 = B, 3 = 漢, 4 = an accent only composites use, 5 = Á built from A and the accent, 6 = 😀. */
function sampleFont(cmapFormats?: readonly (4 | 12)[]): Uint8Array {
    return createTestFont({
        cmapFormats,
        glyphs: [
            { codePoint: A, width: 600 },
            { codePoint: B, width: 650 },
            { codePoint: HAN, width: 1000 },
            { codePoint: null, width: 0 },
            { codePoint: 0xc1, components: [1, 4], width: 600 },
            { codePoint: EMOJI, width: 1200 }
        ]
    });
}

/** The length of each glyph's outline in a font, from its 'loca' table. */
function outlineLengths(data: Uint8Array): number[] {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const tables = new Map<string, number>();
    for (let index = 0; index < view.getUint16(4); index++) {
        const record = 12 + index * 16;
        tables.set(String.fromCharCode(...data.subarray(record, record + 4)), view.getUint32(record + 8));
    }
    const long = view.getInt16(tables.get("head")! + 50) === 1;
    const glyphCount = view.getUint16(tables.get("maxp")! + 4);
    const loca = tables.get("loca")!;
    return Array.from({ length: glyphCount }, (_, glyph) =>
        long
            ? view.getUint32(loca + glyph * 4 + 4) - view.getUint32(loca + glyph * 4)
            : (view.getUint16(loca + glyph * 2 + 2) - view.getUint16(loca + glyph * 2)) * 2
    );
}

describe("parseTrueTypeFont", () => {
    it("finds each character's glyph, in the basic plane and beyond it", () => {
        const font = parseTrueTypeFont(sampleFont());

        expect([font.glyphOf(A), font.glyphOf(B), font.glyphOf(HAN), font.glyphOf(EMOJI)]).toEqual([1, 2, 3, 6]);
        expect(font.glyphOf(0x43)).toBe(0);
    });

    it("reads a font that has only the basic plane's character map", () => {
        const font = parseTrueTypeFont(sampleFont([4]));

        expect([font.glyphOf(A), font.glyphOf(HAN), font.glyphOf(EMOJI)]).toEqual([1, 3, 0]);
    });

    it("gives widths and metrics in thousandths of the font size, and the PostScript name", () => {
        const font = parseTrueTypeFont(sampleFont());

        expect(font.widthOf(font.glyphOf(HAN))).toBe(1000);
        expect(font.widthOf(2)).toBe(650);
        expect([font.ascent, font.descent, font.capHeight]).toEqual([900, -250, 700]);
        expect(font.bbox).toEqual([-50, -200, 1100, 900]);
        expect(font.postScriptName).toBe("MonaTest-Regular");
        expect(font.numGlyphs).toBe(7);
    });

    it("reads the chosen font of a collection", () => {
        const other = createTestFont({ glyphs: [{ codePoint: B, width: 300 }], postScriptName: "Other" });
        const font = parseTrueTypeFont(createTestCollection([other, sampleFont()]), 1);

        expect(font.postScriptName).toBe("MonaTest-Regular");
        expect(font.glyphOf(HAN)).toBe(3);
        expect(() => parseTrueTypeFont(createTestCollection([other]), 2)).toThrow(/no font 2/);
    });

    it("explains why it can't read a CFF font or a web font", () => {
        const cff = new Uint8Array([0x4f, 0x54, 0x54, 0x4f, 0, 0, 0, 0]);
        const woff = new Uint8Array([0x77, 0x4f, 0x46, 0x46, 0, 0, 0, 0]);

        expect(() => parseTrueTypeFont(cff)).toThrow(/CFF outlines/);
        expect(() => parseTrueTypeFont(woff)).toThrow(/WOFF/);
        expect(() => parseTrueTypeFont(new Uint8Array(16))).toThrow(/isn't a TrueType font/);
    });
});

describe("TrueTypeFont.subset", () => {
    it("keeps the outlines of the used glyphs, the missing glyph and composites' parts, and empties the rest", () => {
        const font = parseTrueTypeFont(sampleFont());
        const original = outlineLengths(sampleFont());

        const subset = font.subset([font.glyphOf(0xc1), font.glyphOf(HAN)]);

        const lengths = outlineLengths(subset);
        // Kept: 0 (missing), 1 (A, part of Á), 3 (漢), 4 (accent, part of Á), 5 (Á); emptied: 2 (B), 6 (😀).
        expect(lengths.map(length => length > 0)).toEqual([true, true, false, true, true, true, false]);
        expect(lengths[3]).toBe(Math.ceil(original[3] / 4) * 4);
    });

    it("writes a font that reads back with the same glyphs and widths", () => {
        const font = parseTrueTypeFont(sampleFont());

        const subset = parseTrueTypeFont(addCharacterMap(font.subset([1, 3]), sampleFont()));

        expect(subset.numGlyphs).toBe(font.numGlyphs);
        expect(subset.widthOf(3)).toBe(1000);
    });

    it("writes table checksums and the whole-file checksum adjustment", () => {
        const subset = parseTrueTypeFont(sampleFont()).subset([1]);
        const view = new DataView(subset.buffer);
        let sum = 0;
        for (let offset = 0; offset < subset.length; offset += 4) {
            sum = (sum + view.getUint32(offset)) >>> 0;
        }

        expect(sum).toBe(0xb1b0afba);
    });
});

/** Copies the original font's character map into a subset, which leaves it out, so the subset can be read again. */
function addCharacterMap(subset: Uint8Array, original: Uint8Array): Uint8Array {
    const read = (data: Uint8Array): Map<string, Uint8Array> => {
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const tables = new Map<string, Uint8Array>();
        for (let index = 0; index < view.getUint16(4); index++) {
            const record = 12 + index * 16;
            const offset = view.getUint32(record + 8);
            tables.set(
                String.fromCharCode(...data.subarray(record, record + 4)),
                data.subarray(offset, offset + view.getUint32(record + 12))
            );
        }
        return tables;
    };
    const tables = read(subset);
    tables.set("cmap", read(original).get("cmap")!);
    const names = [...tables.keys()].sort();
    const header = 12 + names.length * 16;
    const size = names.reduce((sum, name) => sum + Math.ceil(tables.get(name)!.length / 4) * 4, header);
    const out = new Uint8Array(size);
    const view = new DataView(out.buffer);
    view.setUint32(0, 0x00010000);
    view.setUint16(4, names.length);
    let offset = header;
    names.forEach((name, index) => {
        const table = tables.get(name)!;
        const record = 12 + index * 16;
        out.set(
            Array.from(name, char => char.charCodeAt(0)),
            record
        );
        view.setUint32(record + 8, offset);
        view.setUint32(record + 12, table.length);
        out.set(table, offset);
        offset += Math.ceil(table.length / 4) * 4;
    });
    return out;
}
