/**
 * Reads a TrueType font (`.ttf`, or one font of a `.ttc` collection) and writes subsets of it with only the glyphs a
 * document uses, for embedding in a PDF. Fonts with CFF outlines (`.otf`) and WOFF files aren't supported.
 */

interface TableRecord {
    readonly length: number;
    readonly offset: number;
}

/** The parts of a TrueType font a PDF needs to describe and embed it. */
export interface TrueTypeFont {
    /** Above the baseline, in thousandths of the font size. */
    readonly ascent: number;
    /** The bounding box of all glyphs, in thousandths of the font size: left, bottom, right, top. */
    readonly bbox: readonly [number, number, number, number];
    /** The height of capital letters, in thousandths of the font size. */
    readonly capHeight: number;
    /** Below the baseline, as a negative number, in thousandths of the font size. */
    readonly descent: number;
    /** The glyph for a character, or 0 (the missing glyph) when the font hasn't one. */
    glyphOf(codePoint: number): number;
    readonly italicAngle: number;
    /** Whether every glyph is as wide as the others. */
    readonly monospace: boolean;
    readonly numGlyphs: number;
    /** The font's PostScript name, safe to use as a PDF name. */
    readonly postScriptName: string;
    /** A copy of the font with the outlines of the given glyphs only; other glyphs keep their ids but draw nothing. */
    subset(glyphs: Iterable<number>): Uint8Array;
    /** A glyph's advance width, in thousandths of the font size. */
    widthOf(glyph: number): number;
}

const TRUETYPE_VERSION = 0x00010000;
const TRUE_TAG = 0x74727565;
const COLLECTION_TAG = 0x74746366;
const OPENTYPE_CFF_TAG = 0x4f54544f;
const WOFF_TAG = 0x774f4646;
const WOFF2_TAG = 0x774f4632;
/** Tables the subset keeps: hinting goes with the outlines, and a PDF reads characters through its own maps. */
const SUBSET_TABLES = ["cvt ", "fpgm", "glyf", "head", "hhea", "hmtx", "loca", "maxp", "prep"];

/** Reads a TrueType font, or the font at `collectionIndex` of a TrueType collection. */
export function parseTrueTypeFont(data: Uint8Array, collectionIndex = 0): TrueTypeFont {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let fontOffset = 0;
    const tag = readUint32(view, 0);
    if (tag === COLLECTION_TAG) {
        const count = readUint32(view, 8);
        if (collectionIndex < 0 || collectionIndex >= count) {
            throw new Error(`The font collection has ${count} fonts; there's no font ${collectionIndex}.`);
        }
        fontOffset = readUint32(view, 12 + collectionIndex * 4);
    } else if (tag === OPENTYPE_CFF_TAG) {
        throw new Error("The font has CFF outlines (.otf). Use a TrueType font (.ttf or .ttc) instead.");
    } else if (tag === WOFF_TAG || tag === WOFF2_TAG) {
        throw new Error("The font is a web font (WOFF). Use a TrueType font (.ttf or .ttc) instead.");
    }
    const version = readUint32(view, fontOffset);
    if (version === OPENTYPE_CFF_TAG) {
        throw new Error("The font has CFF outlines (.otf). Use a TrueType font (.ttf or .ttc) instead.");
    }
    if (version !== TRUETYPE_VERSION && version !== TRUE_TAG) {
        throw new Error("The data isn't a TrueType font.");
    }
    const tables = new Map<string, TableRecord>();
    const tableCount = view.getUint16(fontOffset + 4);
    for (let index = 0; index < tableCount; index++) {
        const record = fontOffset + 12 + index * 16;
        const name = String.fromCharCode(data[record], data[record + 1], data[record + 2], data[record + 3]);
        tables.set(name, { length: readUint32(view, record + 12), offset: readUint32(view, record + 8) });
    }
    for (const required of ["cmap", "glyf", "head", "hhea", "hmtx", "loca", "maxp"]) {
        if (!tables.has(required)) {
            throw new Error(`The font has no '${required}' table, which a TrueType font needs.`);
        }
    }
    const table = (name: string): TableRecord => tables.get(name)!;

    const head = table("head").offset;
    const unitsPerEm = view.getUint16(head + 18);
    const scale = 1000 / unitsPerEm;
    const longLoca = view.getInt16(head + 50) === 1;
    const bbox: [number, number, number, number] = [
        Math.round(view.getInt16(head + 36) * scale),
        Math.round(view.getInt16(head + 38) * scale),
        Math.round(view.getInt16(head + 40) * scale),
        Math.round(view.getInt16(head + 42) * scale)
    ];
    const numGlyphs = view.getUint16(table("maxp").offset + 4);
    const hhea = table("hhea").offset;
    const numberOfHMetrics = view.getUint16(hhea + 34);
    let ascent = view.getInt16(hhea + 4) * scale;
    let descent = view.getInt16(hhea + 6) * scale;
    let capHeight = ascent * 0.7;
    const os2 = tables.get("OS/2");
    if (os2 != null && os2.length >= 72) {
        ascent = view.getInt16(os2.offset + 68) * scale;
        descent = view.getInt16(os2.offset + 70) * scale;
        if (view.getUint16(os2.offset) >= 2 && os2.length >= 90) {
            capHeight = view.getInt16(os2.offset + 88) * scale || capHeight;
        }
    }
    const post = tables.get("post");
    const italicAngle = post == null ? 0 : view.getInt32(post.offset + 4) / 65536;
    const monospace = post != null && post.length >= 16 && readUint32(view, post.offset + 12) !== 0;

    const hmtx = table("hmtx").offset;
    const lastAdvance = view.getUint16(hmtx + (numberOfHMetrics - 1) * 4);
    const widthOf = (glyph: number): number => {
        if (glyph < 0 || glyph >= numGlyphs) {
            return 0;
        }
        const advance = glyph < numberOfHMetrics ? view.getUint16(hmtx + glyph * 4) : lastAdvance;
        return Math.round(advance * scale);
    };

    const loca = table("loca").offset;
    const glyphRange = (glyph: number): readonly [number, number] => {
        if (longLoca) {
            return [readUint32(view, loca + glyph * 4), readUint32(view, loca + glyph * 4 + 4)];
        }
        return [view.getUint16(loca + glyph * 2) * 2, view.getUint16(loca + glyph * 2 + 2) * 2];
    };

    const glyphOf = createCharacterMap(view, table("cmap").offset);
    return {
        ascent: Math.round(ascent),
        bbox,
        capHeight: Math.round(capHeight),
        descent: Math.round(descent),
        glyphOf: codePoint => {
            const glyph = glyphOf(codePoint);
            return glyph < numGlyphs ? glyph : 0;
        },
        italicAngle,
        monospace,
        numGlyphs,
        postScriptName: readPostScriptName(view, tables.get("name")) ?? "Font",
        subset: glyphs =>
            writeSubset(data, tables, numGlyphs, glyphRange, table("glyf").offset, withComponents(glyphs)),
        widthOf
    };

    /** The glyphs and the glyphs that composite ones among them are built from. */
    function withComponents(glyphs: Iterable<number>): Set<number> {
        const result = new Set<number>([0]);
        const pending = [...glyphs];
        const glyf = table("glyf").offset;
        while (pending.length > 0) {
            const glyph = pending.pop()!;
            if (glyph < 0 || glyph >= numGlyphs || (result.has(glyph) && glyph !== 0)) {
                continue;
            }
            result.add(glyph);
            const [start, end] = glyphRange(glyph);
            if (end - start < 10 || view.getInt16(glyf + start) >= 0) {
                continue;
            }
            // A composite glyph: a list of components, each with flags, a glyph index and its placement.
            let position = glyf + start + 10;
            for (;;) {
                const flags = view.getUint16(position);
                pending.push(view.getUint16(position + 2));
                position += 4 + (flags & 0x0001 ? 4 : 2);
                if (flags & 0x0008) {
                    position += 2;
                } else if (flags & 0x0040) {
                    position += 4;
                } else if (flags & 0x0080) {
                    position += 8;
                }
                if (!(flags & 0x0020)) {
                    break;
                }
            }
        }
        return result;
    }
}

/** Looks characters up in the font's best Unicode character map: format 12 for every plane, or else format 4. */
function createCharacterMap(view: DataView, cmap: number): (codePoint: number) => number {
    const count = view.getUint16(cmap + 2);
    let format4: number | null = null;
    let format12: number | null = null;
    for (let index = 0; index < count; index++) {
        const record = cmap + 4 + index * 8;
        const platform = view.getUint16(record);
        const encoding = view.getUint16(record + 2);
        const offset = cmap + readUint32(view, record + 4);
        const format = view.getUint16(offset);
        const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
        if (!unicode) {
            continue;
        }
        if (format === 12 && format12 == null) {
            format12 = offset;
        } else if (format === 4 && format4 == null) {
            format4 = offset;
        }
    }
    if (format12 != null) {
        const groups = readUint32(view, format12 + 12);
        return codePoint => {
            let low = 0;
            let high = groups - 1;
            while (low <= high) {
                const middle = (low + high) >> 1;
                const group = format12! + 16 + middle * 12;
                const start = readUint32(view, group);
                const end = readUint32(view, group + 4);
                if (codePoint < start) {
                    high = middle - 1;
                } else if (codePoint > end) {
                    low = middle + 1;
                } else {
                    return readUint32(view, group + 8) + (codePoint - start);
                }
            }
            return 0;
        };
    }
    if (format4 != null) {
        const segments = view.getUint16(format4 + 6) / 2;
        const ends = format4 + 14;
        const starts = ends + segments * 2 + 2;
        const deltas = starts + segments * 2;
        const rangeOffsets = deltas + segments * 2;
        return codePoint => {
            if (codePoint > 0xffff) {
                return 0;
            }
            let low = 0;
            let high = segments - 1;
            while (low <= high) {
                const middle = (low + high) >> 1;
                const end = view.getUint16(ends + middle * 2);
                const start = view.getUint16(starts + middle * 2);
                if (codePoint > end) {
                    low = middle + 1;
                } else if (codePoint < start) {
                    high = middle - 1;
                } else {
                    const delta = view.getInt16(deltas + middle * 2);
                    const rangeOffset = view.getUint16(rangeOffsets + middle * 2);
                    if (rangeOffset === 0) {
                        return (codePoint + delta) & 0xffff;
                    }
                    const glyphAddress = rangeOffsets + middle * 2 + rangeOffset + (codePoint - start) * 2;
                    const glyph = view.getUint16(glyphAddress);
                    return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
                }
            }
            return 0;
        };
    }
    throw new Error("The font has no Unicode character map.");
}

function readPostScriptName(view: DataView, name: TableRecord | undefined): string | null {
    if (name == null) {
        return null;
    }
    const count = view.getUint16(name.offset + 2);
    const strings = name.offset + view.getUint16(name.offset + 4);
    for (let index = 0; index < count; index++) {
        const record = name.offset + 6 + index * 12;
        if (view.getUint16(record + 6) !== 6) {
            continue;
        }
        const platform = view.getUint16(record);
        const length = view.getUint16(record + 8);
        const offset = strings + view.getUint16(record + 10);
        let text = "";
        if (platform === 3 || platform === 0) {
            for (let char = 0; char + 1 < length; char += 2) {
                text += String.fromCharCode(view.getUint16(offset + char));
            }
        } else {
            for (let char = 0; char < length; char++) {
                text += String.fromCharCode(view.getUint8(offset + char));
            }
        }
        // A PDF name can't hold spaces or delimiters.
        const cleaned = text.replace(/[^\x21-\x7e]|[()<>[\]{}/%#]/g, "");
        if (cleaned !== "") {
            return cleaned;
        }
    }
    return null;
}

function readUint32(view: DataView, offset: number): number {
    return view.getUint32(offset);
}

/** Sums a table's 32-bit words, as a font's table directory records it. */
function tableChecksum(bytes: Uint8Array): number {
    const padded = new Uint8Array(Math.ceil(bytes.length / 4) * 4);
    padded.set(bytes);
    const view = new DataView(padded.buffer);
    let sum = 0;
    for (let offset = 0; offset < padded.length; offset += 4) {
        sum = (sum + view.getUint32(offset)) >>> 0;
    }
    return sum;
}

function writeSubset(
    data: Uint8Array,
    tables: ReadonlyMap<string, TableRecord>,
    numGlyphs: number,
    glyphRange: (glyph: number) => readonly [number, number],
    glyf: number,
    glyphs: ReadonlySet<number>
): Uint8Array {
    // The kept glyphs' outlines, each padded to a 4-byte boundary, and long offsets to them for every glyph.
    const parts: Uint8Array[] = [];
    const loca = new DataView(new ArrayBuffer((numGlyphs + 1) * 4));
    let glyfLength = 0;
    for (let glyph = 0; glyph < numGlyphs; glyph++) {
        loca.setUint32(glyph * 4, glyfLength);
        if (!glyphs.has(glyph)) {
            continue;
        }
        const [start, end] = glyphRange(glyph);
        if (end <= start) {
            continue;
        }
        const outline = data.subarray(glyf + start, glyf + end);
        const paddedLength = Math.ceil(outline.length / 4) * 4;
        const padded = new Uint8Array(paddedLength);
        padded.set(outline);
        parts.push(padded);
        glyfLength += paddedLength;
    }
    loca.setUint32(numGlyphs * 4, glyfLength);
    const glyfBytes = new Uint8Array(glyfLength);
    let position = 0;
    for (const part of parts) {
        glyfBytes.set(part, position);
        position += part.length;
    }

    const output = new Map<string, Uint8Array>();
    for (const name of SUBSET_TABLES) {
        const record = tables.get(name);
        if (name === "glyf") {
            output.set(name, glyfBytes);
        } else if (name === "loca") {
            output.set(name, new Uint8Array(loca.buffer));
        } else if (record != null) {
            output.set(name, data.slice(record.offset, record.offset + record.length));
        }
    }
    // The new 'loca' uses long offsets, and the checksum adjustment is worked out once the file is written.
    const head = output.get("head")!;
    const headView = new DataView(head.buffer, head.byteOffset, head.byteLength);
    headView.setUint32(8, 0);
    headView.setInt16(50, 1);

    const names = [...output.keys()].sort();
    const headerLength = 12 + names.length * 16;
    let fileLength = headerLength;
    for (const name of names) {
        fileLength += Math.ceil(output.get(name)!.length / 4) * 4;
    }
    const file = new Uint8Array(fileLength);
    const fileView = new DataView(file.buffer);
    const entrySelector = Math.floor(Math.log2(names.length));
    const searchRange = 2 ** entrySelector * 16;
    fileView.setUint32(0, TRUETYPE_VERSION);
    fileView.setUint16(4, names.length);
    fileView.setUint16(6, searchRange);
    fileView.setUint16(8, entrySelector);
    fileView.setUint16(10, names.length * 16 - searchRange);
    let offset = headerLength;
    let headOffset = 0;
    names.forEach((name, index) => {
        const bytes = output.get(name)!;
        const record = 12 + index * 16;
        for (let char = 0; char < 4; char++) {
            file[record + char] = name.charCodeAt(char);
        }
        fileView.setUint32(record + 4, tableChecksum(bytes));
        fileView.setUint32(record + 8, offset);
        fileView.setUint32(record + 12, bytes.length);
        file.set(bytes, offset);
        if (name === "head") {
            headOffset = offset;
        }
        offset += Math.ceil(bytes.length / 4) * 4;
    });
    fileView.setUint32(headOffset + 8, (0xb1b0afba - tableChecksum(file)) >>> 0);
    return file;
}
