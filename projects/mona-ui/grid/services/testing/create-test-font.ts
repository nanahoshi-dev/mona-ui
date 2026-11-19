/** A glyph of the test font: a square, or a composite of two other glyphs. */
export interface TestGlyph {
    /** The character the glyph draws, or `null` for a glyph only composites use. */
    readonly codePoint: number | null;
    /** The glyphs a composite is built from, by index; left out for a simple square. */
    readonly components?: readonly [number, number];
    /** The advance width in font units (1000 per em). */
    readonly width: number;
}

export interface TestFontOptions {
    /** The character maps to include; both by default. */
    readonly cmapFormats?: readonly (4 | 12)[];
    /** Glyph 0, the missing glyph, comes first on its own; these follow from glyph 1. */
    readonly glyphs: readonly TestGlyph[];
    readonly postScriptName?: string;
}

const UNITS_PER_EM = 1000;

/** Builds a small TrueType font in memory, so the PDF export can be tested without a font file. */
export function createTestFont(options: TestFontOptions): Uint8Array {
    const glyphs: TestGlyph[] = [{ codePoint: null, width: 500 }, ...options.glyphs];
    const outlines = glyphs.map((glyph, index) =>
        glyph.components == null ? squareGlyph(100 + index) : compositeGlyph(glyph.components)
    );
    const loca = new DataView(new ArrayBuffer((glyphs.length + 1) * 4));
    let offset = 0;
    outlines.forEach((outline, index) => {
        loca.setUint32(index * 4, offset);
        offset += outline.length;
    });
    loca.setUint32(glyphs.length * 4, offset);
    const glyf = concat(outlines);

    const head = new DataView(new ArrayBuffer(54));
    head.setUint32(0, 0x00010000);
    head.setUint32(12, 0x5f0f3cf5);
    head.setUint16(18, UNITS_PER_EM);
    head.setInt16(36, -50);
    head.setInt16(38, -200);
    head.setInt16(40, 1100);
    head.setInt16(42, 900);
    head.setInt16(50, 1);

    const hhea = new DataView(new ArrayBuffer(36));
    hhea.setUint32(0, 0x00010000);
    hhea.setInt16(4, 880);
    hhea.setInt16(6, -120);
    hhea.setUint16(34, glyphs.length);

    const hmtx = new DataView(new ArrayBuffer(glyphs.length * 4));
    glyphs.forEach((glyph, index) => hmtx.setUint16(index * 4, glyph.width));

    const maxp = new DataView(new ArrayBuffer(6));
    maxp.setUint32(0, 0x00005000);
    maxp.setUint16(4, glyphs.length);

    const os2 = new DataView(new ArrayBuffer(96));
    os2.setUint16(0, 4);
    os2.setInt16(68, 900);
    os2.setInt16(70, -250);
    os2.setInt16(88, 700);

    const post = new DataView(new ArrayBuffer(32));
    post.setUint32(0, 0x00030000);

    const mapped = glyphs
        .map((glyph, index) => ({ codePoint: glyph.codePoint, glyph: index }))
        .filter((entry): entry is { codePoint: number; glyph: number } => entry.codePoint != null)
        .sort((left, right) => left.codePoint - right.codePoint);
    const tables = new Map<string, Uint8Array>([
        ["OS/2", bytesOf(os2)],
        ["cmap", cmapTable(mapped, options.cmapFormats ?? [4, 12])],
        ["glyf", glyf],
        ["head", bytesOf(head)],
        ["hhea", bytesOf(hhea)],
        ["hmtx", bytesOf(hmtx)],
        ["loca", bytesOf(loca)],
        ["maxp", bytesOf(maxp)],
        ["name", nameTable(options.postScriptName ?? "MonaTest-Regular")],
        ["post", bytesOf(post)]
    ]);
    return sfnt(tables);
}

/** Wraps a font in a TrueType collection header, after a font that isn't wanted. */
export function createTestCollection(fonts: readonly Uint8Array[]): Uint8Array {
    const header = 12 + fonts.length * 4;
    const out = new Uint8Array(header + fonts.reduce((sum, font) => sum + font.length, 0));
    const view = new DataView(out.buffer);
    view.setUint32(0, 0x74746366);
    view.setUint32(4, 0x00010000);
    view.setUint32(8, fonts.length);
    let offset = header;
    fonts.forEach((font, index) => {
        view.setUint32(12 + index * 4, offset);
        // Table offsets in a collection count from the start of the file.
        const copy = font.slice();
        const copyView = new DataView(copy.buffer);
        const tableCount = copyView.getUint16(4);
        for (let table = 0; table < tableCount; table++) {
            const record = 12 + table * 16;
            copyView.setUint32(record + 8, copyView.getUint32(record + 8) + offset);
        }
        out.set(copy, offset);
        offset += font.length;
    });
    return out;
}

function bytesOf(view: DataView): Uint8Array {
    return new Uint8Array(view.buffer);
}

function cmapTable(mapped: readonly { codePoint: number; glyph: number }[], formats: readonly (4 | 12)[]): Uint8Array {
    const subtables: { encoding: number; data: Uint8Array }[] = [];
    if (formats.includes(4)) {
        const bmp = mapped.filter(entry => entry.codePoint <= 0xffff);
        const segments = [...bmp.map(entry => ({ end: entry.codePoint, glyph: entry.glyph, start: entry.codePoint }))];
        segments.push({ end: 0xffff, glyph: 1, start: 0xffff });
        const count = segments.length;
        const data = new DataView(new ArrayBuffer(16 + count * 8));
        data.setUint16(0, 4);
        data.setUint16(2, data.byteLength);
        data.setUint16(6, count * 2);
        segments.forEach((segment, index) => {
            data.setUint16(14 + index * 2, segment.end);
            data.setUint16(16 + count * 2 + index * 2, segment.start);
            // The last segment maps 0xFFFF to glyph 0, as the format asks.
            const delta = segment.start === 0xffff ? 1 : (segment.glyph - segment.start) & 0xffff;
            data.setUint16(16 + count * 4 + index * 2, delta);
            data.setUint16(16 + count * 6 + index * 2, 0);
        });
        subtables.push({ data: bytesOf(data), encoding: 1 });
    }
    if (formats.includes(12)) {
        const data = new DataView(new ArrayBuffer(16 + mapped.length * 12));
        data.setUint16(0, 12);
        data.setUint32(4, data.byteLength);
        data.setUint32(12, mapped.length);
        mapped.forEach((entry, index) => {
            data.setUint32(16 + index * 12, entry.codePoint);
            data.setUint32(20 + index * 12, entry.codePoint);
            data.setUint32(24 + index * 12, entry.glyph);
        });
        subtables.push({ data: bytesOf(data), encoding: 10 });
    }
    const header = new DataView(new ArrayBuffer(4 + subtables.length * 8));
    header.setUint16(2, subtables.length);
    let offset = header.byteLength;
    subtables.forEach((subtable, index) => {
        header.setUint16(4 + index * 8, 3);
        header.setUint16(6 + index * 8, subtable.encoding);
        header.setUint32(8 + index * 8, offset);
        offset += subtable.data.length;
    });
    return concat([bytesOf(header), ...subtables.map(subtable => subtable.data)]);
}

function compositeGlyph(components: readonly [number, number]): Uint8Array {
    const data = new DataView(new ArrayBuffer(10 + 2 * 8));
    data.setInt16(0, -1);
    data.setInt16(6, 600);
    data.setInt16(8, 800);
    components.forEach((component, index) => {
        const record = 10 + index * 8;
        // Word arguments that are x/y offsets, and more components after the first.
        data.setUint16(record, 0x0001 | 0x0002 | (index === 0 ? 0x0020 : 0));
        data.setUint16(record + 2, component);
        data.setInt16(record + 4, index * 50);
        data.setInt16(record + 6, index * 100);
    });
    return bytesOf(data);
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
    const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}

function nameTable(postScriptName: string): Uint8Array {
    const text = new Uint8Array(postScriptName.length * 2);
    const textView = new DataView(text.buffer);
    Array.from(postScriptName).forEach((char, index) => textView.setUint16(index * 2, char.charCodeAt(0)));
    const header = new DataView(new ArrayBuffer(6 + 12));
    header.setUint16(2, 1);
    header.setUint16(4, 18);
    header.setUint16(6, 3);
    header.setUint16(8, 1);
    header.setUint16(10, 0x409);
    header.setUint16(12, 6);
    header.setUint16(14, text.length);
    header.setUint16(16, 0);
    return concat([bytesOf(header), text]);
}

function sfnt(tables: ReadonlyMap<string, Uint8Array>): Uint8Array {
    const names = [...tables.keys()].sort();
    const header = 12 + names.length * 16;
    const padded = names.map(name => {
        const table = tables.get(name)!;
        const out = new Uint8Array(Math.ceil(table.length / 4) * 4);
        out.set(table);
        return out;
    });
    const file = new Uint8Array(header + padded.reduce((sum, table) => sum + table.length, 0));
    const view = new DataView(file.buffer);
    view.setUint32(0, 0x00010000);
    view.setUint16(4, names.length);
    let offset = header;
    names.forEach((name, index) => {
        const record = 12 + index * 16;
        for (let char = 0; char < 4; char++) {
            file[record + char] = name.charCodeAt(char);
        }
        view.setUint32(record + 8, offset);
        view.setUint32(record + 12, tables.get(name)!.length);
        file.set(padded[index], offset);
        offset += padded[index].length;
    });
    return file;
}

function squareGlyph(size: number): Uint8Array {
    // One contour of four on-curve points, with 16-bit coordinates written as deltas.
    const data = new DataView(new ArrayBuffer(10 + 2 + 2 + 4 + 8 + 8));
    data.setInt16(0, 1);
    data.setInt16(6, size);
    data.setInt16(8, size);
    data.setUint16(10, 3);
    data.setUint16(12, 0);
    for (let point = 0; point < 4; point++) {
        data.setUint8(14 + point, 0x01);
    }
    const xs = [0, size, 0, -size];
    const ys = [0, 0, size, 0];
    xs.forEach((x, index) => data.setInt16(18 + index * 2, x));
    ys.forEach((y, index) => data.setInt16(26 + index * 2, y));
    return bytesOf(data);
}
