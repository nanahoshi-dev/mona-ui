import { getStandardFontWidth, type StandardFontName, toWinAnsiCode } from "./grid-pdf-standard-font";
import type { TrueTypeFont } from "./grid-pdf-truetype";

/** A header cell: a column group's title over the columns it spans, or a column's title. */
export interface PdfHeaderCell {
    readonly firstColumn: number;
    /** Whether the title is centered over its columns, as a column group's is. */
    readonly group: boolean;
    readonly lastColumn: number;
    /** How many header rows the cell spans down from its own. */
    readonly rowSpan: number;
    readonly text: string;
}

export interface PdfTableRow {
    readonly cells: readonly string[];
    /** How many tree levels the tree column's text is indented by. */
    readonly indent: number;
}

/** A table to print: its columns, its header rows from the top, and its rows. */
export interface PdfTable {
    /** Each column's text alignment: `end` for numbers. */
    readonly alignments: readonly ("end" | "start")[];
    /** Each column's width in CSS pixels. */
    readonly columnWidths: readonly number[];
    readonly header: readonly (readonly PdfHeaderCell[])[];
    /** Whether the columns run from right to left. */
    readonly rightToLeft: boolean;
    readonly rows: readonly PdfTableRow[];
    /** The column whose text is indented by tree level, or `null`. */
    readonly treeColumn: number | null;
}

export interface PdfDocumentOptions {
    /** The text size in points before the table is scaled to fit the page's width. */
    readonly fontSize: number;
    /** A font for the text Helvetica can't show, such as Chinese, Japanese or Korean; and its bold face. */
    readonly fonts: { readonly bold: TrueTypeFont | null; readonly regular: TrueTypeFont | null };
    /** The margin around the page, in points. */
    readonly margin: number;
    readonly modified: Date;
    /** The page's width and height in points. */
    readonly pageSize: readonly [number, number];
    /** A title above the table on the first page, which is also the document's title; `null` for none. */
    readonly title: string | null;
}

/** The PDF's MIME type. */
export const PDF_MIME_TYPE = "application/pdf";

const PIXELS_TO_POINTS = 0.75;
const LINE_HEIGHT = 1.25;
const MIN_FONT_SIZE = 5;
const TREE_INDENT = 10;
const HEADER_FILL = "0.94 g";
const BORDER_STROKE = "0.78 G";
/** CJK ideographs, kana, hangul and their punctuation: a line can break before or after each of them. */
const CJK_RANGES =
    "\u2e80-\u2fff\u3000-\u303f\u3040-\u30ff\u3100-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef";
/** Spaces, single CJK characters, and runs of anything else: the pieces a line is built from. */
const TOKEN_PATTERN = new RegExp(`\\s+|[${CJK_RANGES}]|[^\\s${CJK_RANGES}]+`, "gu");

/** A run of text in one font. */
interface TextRun {
    readonly face: FontFace;
    readonly text: string;
    /** In thousandths of the font size. */
    readonly width: number;
}

interface FontFace {
    covers(codePoint: number): boolean;
    /** The run's text as a PDF hex string. */
    encode(text: string): string;
    /** Draws thicker strokes, for a bold face the font doesn't have. */
    readonly fakeBold: boolean;
    readonly resource: string;
    width(codePoint: number): number;
}

/** Helvetica or Helvetica Bold, which every PDF reader has: no embedding, but Windows-1252 characters only. */
class StandardFace implements FontFace {
    public readonly fakeBold = false;
    public constructor(
        public readonly font: StandardFontName,
        public readonly resource: string
    ) {}

    public covers(codePoint: number): boolean {
        return toWinAnsiCode(codePoint) != null;
    }

    public encode(text: string): string {
        let hex = "";
        for (const char of text) {
            hex += hex2(toWinAnsiCode(char.codePointAt(0)!) ?? 0x3f);
        }
        return `<${hex}>`;
    }

    public width(codePoint: number): number {
        return getStandardFontWidth(this.font, toWinAnsiCode(codePoint) ?? 0x3f);
    }
}

/** A TrueType font embedded as a subset of the glyphs the document uses. */
class EmbeddedFace implements FontFace {
    public constructor(
        public readonly font: TrueTypeFont,
        public readonly resource: string,
        public readonly fakeBold: boolean,
        /** Each used glyph's text, for copying and searching; shared with the face that draws it thickened. */
        public readonly used = new Map<number, string>()
    ) {}

    public covers(codePoint: number): boolean {
        return this.font.glyphOf(codePoint) !== 0;
    }

    public encode(text: string): string {
        let hex = "";
        for (const char of text) {
            const glyph = this.font.glyphOf(char.codePointAt(0)!);
            if (!this.used.has(glyph)) {
                this.used.set(glyph, char);
            }
            hex += hex4(glyph);
        }
        return `<${hex}>`;
    }

    public width(codePoint: number): number {
        return this.font.widthOf(this.font.glyphOf(codePoint));
    }
}

/** The faces text is drawn in: the embedded font where it has the glyph, Helvetica where it hasn't. */
class FontSet {
    readonly #bold: { readonly embedded: EmbeddedFace | null; readonly standard: StandardFace };
    readonly #regular: { readonly embedded: EmbeddedFace | null; readonly standard: StandardFace };
    public readonly embedded: EmbeddedFace[] = [];

    public constructor(fonts: PdfDocumentOptions["fonts"]) {
        const regular = fonts.regular == null ? null : new EmbeddedFace(fonts.regular, "F3", false);
        // Without a bold face, bold text is the regular font thickened: the same embedded font, so the same glyphs.
        const bold =
            fonts.bold != null
                ? new EmbeddedFace(fonts.bold, "F4", false)
                : regular != null
                  ? new EmbeddedFace(regular.font, regular.resource, true, regular.used)
                  : null;
        this.#regular = { embedded: regular, standard: new StandardFace("Helvetica", "F1") };
        this.#bold = { embedded: bold, standard: new StandardFace("Helvetica-Bold", "F2") };
        for (const face of [regular, bold]) {
            if (face != null && !this.embedded.some(known => known.resource === face.resource)) {
                this.embedded.push(face);
            }
        }
    }

    /** The text's width in points. */
    public measure(text: string, bold: boolean, fontSize: number): number {
        return (this.runs(text, bold).reduce((sum, run) => sum + run.width, 0) * fontSize) / 1000;
    }

    /** Splits text into runs of one face each. A character neither face has prints in Helvetica, as a question mark. */
    public runs(text: string, bold: boolean): TextRun[] {
        const faces = bold ? this.#bold : this.#regular;
        const runs: { face: FontFace; text: string; width: number }[] = [];
        for (const char of text) {
            const codePoint = char.codePointAt(0)!;
            const face = faces.embedded?.covers(codePoint) ? faces.embedded : faces.standard;
            const width = face.width(codePoint);
            const last = runs.at(-1);
            if (last?.face === face) {
                last.text += char;
                last.width += width;
            } else {
                runs.push({ face, text: char, width });
            }
        }
        return runs;
    }
}

/** Lays the table out on pages, with the header on each, and writes it as a PDF. */
export async function writePdfTable(table: PdfTable, options: PdfDocumentOptions): Promise<Uint8Array> {
    const fonts = new FontSet(options.fonts);
    const pages = layOutPages(table, options, fonts);
    const writer = new PdfObjectWriter();
    const catalog = writer.reserve();
    const pageTree = writer.reserve();
    const info = writer.reserve();
    const standardFonts = [
        writer.add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`),
        writer.add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`)
    ];
    // Drawing the pages first records the glyphs each embedded font has to keep.
    const contents = pages.map(page => page.draw());
    const fontResources = [`/F1 ${standardFonts[0]} 0 R`, `/F2 ${standardFonts[1]} 0 R`];
    for (const face of fonts.embedded) {
        if (face.used.size === 0) {
            continue;
        }
        fontResources.push(`/${face.resource} ${await writeEmbeddedFont(writer, face)} 0 R`);
    }
    const resources = `<< /Font << ${fontResources.join(" ")} >> >>`;
    const [width, height] = options.pageSize;
    const pageIds: number[] = [];
    for (const content of contents) {
        const stream = await writer.addStream("", new TextEncoder().encode(content));
        pageIds.push(
            writer.add(
                `<< /Type /Page /Parent ${pageTree} 0 R /MediaBox [0 0 ${num(width)} ${num(height)}] ` +
                    `/Resources ${resources} /Contents ${stream} 0 R >>`
            )
        );
    }
    writer.set(
        pageTree,
        `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`
    );
    writer.set(catalog, `<< /Type /Catalog /Pages ${pageTree} 0 R >>`);
    const title = options.title == null ? "" : `/Title ${toTextString(options.title)} `;
    writer.set(
        info,
        `<< ${title}/Producer ${toTextString("Mona UI")} /CreationDate (${toPdfDate(options.modified)}) >>`
    );
    return writer.finish(catalog, info);
}

/** One laid-out page, which draws itself as a content stream. */
interface PdfPage {
    draw(): string;
}

function layOutPages(table: PdfTable, options: PdfDocumentOptions, fonts: FontSet): PdfPage[] {
    const [pageWidth, pageHeight] = options.pageSize;
    const margin = options.margin;
    const contentWidth = pageWidth - margin * 2;
    const naturalWidths = table.columnWidths.map(width => Math.max(1, width) * PIXELS_TO_POINTS);
    const naturalWidth = naturalWidths.reduce((sum, width) => sum + width, 0);
    // A table wider than the page shrinks to fit, and its text with it, though less, so it stays readable.
    const scale = naturalWidth > contentWidth ? contentWidth / naturalWidth : 1;
    const widths = naturalWidths.map(width => width * scale);
    const fontSize = Math.max(MIN_FONT_SIZE, options.fontSize * Math.max(scale, 0.65));
    const lineHeight = fontSize * LINE_HEIGHT;
    const padX = Math.max(2, 4 * scale);
    const padY = Math.max(1.5, fontSize * 0.35);
    const footerHeight = fontSize * 2.5;
    const left = (column: number, lastColumn = column): number => {
        let x = 0;
        for (let index = 0; index < column; index++) {
            x += widths[index];
        }
        if (!table.rightToLeft) {
            return margin + x;
        }
        let span = 0;
        for (let index = column; index <= lastColumn; index++) {
            span += widths[index];
        }
        // Right to left, the first column is at the right edge of the page's content.
        return margin + contentWidth - x - span;
    };
    const spanWidth = (first: number, last: number): number => {
        let width = 0;
        for (let index = first; index <= last; index++) {
            width += widths[index];
        }
        return width;
    };

    // The header: each row as tall as its tallest single-row cell, and taller where a cell spanning rows needs it.
    const headerCells = table.header.flatMap((cells, rowIndex) =>
        cells.map(cell => ({
            ...cell,
            lines: wrapText(cell.text, spanWidth(cell.firstColumn, cell.lastColumn) - padX * 2, text =>
                fonts.measure(text, true, fontSize)
            ),
            rowIndex
        }))
    );
    const headerHeights = table.header.map(() => lineHeight + padY * 2);
    for (const cell of headerCells.filter(cell => cell.rowSpan === 1)) {
        headerHeights[cell.rowIndex] = Math.max(
            headerHeights[cell.rowIndex],
            cell.lines.length * lineHeight + padY * 2
        );
    }
    for (const cell of headerCells.filter(cell => cell.rowSpan > 1)) {
        const last = Math.min(table.header.length - 1, cell.rowIndex + cell.rowSpan - 1);
        const spanned = headerHeights.slice(cell.rowIndex, last + 1).reduce((sum, height) => sum + height, 0);
        const needed = cell.lines.length * lineHeight + padY * 2;
        if (needed > spanned) {
            headerHeights[last] += needed - spanned;
        }
    }
    const headerHeight = headerHeights.reduce((sum, height) => sum + height, 0);
    const titleSize = fontSize * 1.5;
    const titleLines =
        options.title == null || options.title === ""
            ? []
            : wrapText(options.title, contentWidth, text => fonts.measure(text, true, titleSize));
    const titleHeight = titleLines.length === 0 ? 0 : titleLines.length * titleSize * LINE_HEIGHT + fontSize;

    // A row never runs past a page: its text stops at what fits, with an ellipsis.
    const bodyTop = (first: boolean): number => pageHeight - margin - (first ? titleHeight : 0) - headerHeight;
    const bodyBottom = margin + footerHeight;
    const maxLines = Math.max(1, Math.floor((bodyTop(true) - bodyBottom - padY * 2) / lineHeight));
    const rows = table.rows.map(row => {
        const cells = row.cells.map((text, column) => {
            const indent = column === table.treeColumn ? row.indent * TREE_INDENT * Math.max(scale, 0.65) : 0;
            const lines = wrapText(
                text,
                widths[column] - padX * 2 - indent,
                line => fonts.measure(line, false, fontSize),
                maxLines
            );
            return { indent, lines };
        });
        const lineCount = Math.max(1, ...cells.map(cell => cell.lines.length));
        return { cells, height: lineCount * lineHeight + padY * 2 };
    });

    const pageRows: (typeof rows)[] = [];
    let current: typeof rows = [];
    let y = bodyTop(true);
    for (const row of rows) {
        if (y - row.height < bodyBottom && current.length > 0) {
            pageRows.push(current);
            current = [];
            y = bodyTop(false);
        }
        current.push(row);
        y -= row.height;
    }
    pageRows.push(current);

    const textOps = (
        lines: readonly string[],
        x: number,
        width: number,
        top: number,
        height: number,
        align: "center" | "end" | "start",
        bold: boolean,
        size = fontSize
    ): string => {
        const leading = size * LINE_HEIGHT;
        // The lines sit in the middle of the cell, as the grid shows them.
        let lineTop = top - (height - lines.length * leading) / 2;
        const ops: string[] = [];
        for (const line of lines) {
            const runs = fonts.runs(line, bold);
            const lineWidth = (runs.reduce((sum, run) => sum + run.width, 0) * size) / 1000;
            const physical = table.rightToLeft && align !== "center" ? (align === "start" ? "end" : "start") : align;
            let runX =
                physical === "start" ? x : physical === "end" ? x + width - lineWidth : x + (width - lineWidth) / 2;
            const baseline = lineTop - (leading - size) / 2 - size * 0.8;
            for (const run of runs) {
                const stroke = run.face.fakeBold ? `2 Tr ${num(size * 0.03)} w ` : "";
                ops.push(
                    `BT /${run.face.resource} ${num(size)} Tf ${stroke}1 0 0 1 ${num(runX)} ${num(baseline)} Tm ` +
                        `${run.face.encode(run.text)} Tj${stroke === "" ? "" : " 0 Tr"} ET`
                );
                runX += (run.width * size) / 1000;
            }
            lineTop -= leading;
        }
        return ops.join("\n");
    };

    const pageCount = pageRows.length;
    return pageRows.map((bodyRows, pageIndex) => ({
        draw: () => {
            const fills: string[] = [];
            const strokes: string[] = [];
            const texts: string[] = [];
            let top = pageHeight - margin;
            if (pageIndex === 0 && titleLines.length > 0) {
                texts.push(
                    textOps(
                        titleLines,
                        margin,
                        contentWidth,
                        top,
                        titleLines.length * titleSize * LINE_HEIGHT,
                        "start",
                        true,
                        titleSize
                    )
                );
                top -= titleHeight;
            }
            const rowTops: number[] = [];
            for (const height of headerHeights) {
                rowTops.push(top);
                top -= height;
            }
            for (const cell of headerCells) {
                const last = Math.min(table.header.length - 1, cell.rowIndex + cell.rowSpan - 1);
                const height = headerHeights.slice(cell.rowIndex, last + 1).reduce((sum, value) => sum + value, 0);
                const x = left(cell.firstColumn, cell.lastColumn);
                const width = spanWidth(cell.firstColumn, cell.lastColumn);
                const cellTop = rowTops[cell.rowIndex];
                fills.push(`${num(x)} ${num(cellTop - height)} ${num(width)} ${num(height)} re`);
                strokes.push(`${num(x)} ${num(cellTop - height)} ${num(width)} ${num(height)} re`);
                texts.push(
                    textOps(
                        cell.lines,
                        x + padX,
                        width - padX * 2,
                        cellTop - padY,
                        height - padY * 2,
                        cell.group ? "center" : "start",
                        true
                    )
                );
            }
            for (const row of bodyRows) {
                row.cells.forEach((cell, column) => {
                    const x = left(column);
                    const width = widths[column];
                    strokes.push(`${num(x)} ${num(top - row.height)} ${num(width)} ${num(row.height)} re`);
                    const indentStart = table.rightToLeft ? 0 : cell.indent;
                    const indentEnd = table.rightToLeft ? cell.indent : 0;
                    texts.push(
                        textOps(
                            cell.lines,
                            x + padX + indentStart,
                            width - padX * 2 - indentStart - indentEnd,
                            top - padY,
                            row.height - padY * 2,
                            table.alignments[column] ?? "start",
                            false
                        )
                    );
                });
                top -= row.height;
            }
            const pageNumber = `${pageIndex + 1} / ${pageCount}`;
            const footerWidth = fonts.measure(pageNumber, false, fontSize);
            texts.push(
                `BT /F1 ${num(fontSize)} Tf 1 0 0 1 ${num((pageWidth - footerWidth) / 2)} ${num(margin)} Tm ` +
                    `${new StandardFace("Helvetica", "F1").encode(pageNumber)} Tj ET`
            );
            return [
                `q ${HEADER_FILL}`,
                fills.length === 0 ? "" : `${fills.join("\n")}\nf`,
                `Q q ${BORDER_STROKE} 0.5 w`,
                strokes.length === 0 ? "" : `${strokes.join("\n")}\nS`,
                "Q 0 g",
                ...texts
            ]
                .filter(part => part !== "")
                .join("\n");
        }
    }));
}

/**
 * Wraps text to lines that fit the width, breaking at spaces and between CJK characters, and inside words that
 * are too long for a line. With `maxLines`, the last line that fits ends with an ellipsis instead.
 */
export function wrapText(
    text: string,
    width: number,
    measure: (text: string) => number,
    maxLines = Number.POSITIVE_INFINITY
): string[] {
    const lines: string[] = [];
    for (const paragraph of text.split(/\r\n|\r|\n/)) {
        let line = "";
        for (const token of paragraph.match(TOKEN_PATTERN) ?? []) {
            const candidate = line + token;
            if (measure(candidate.trimEnd()) <= width || line.trim() === "") {
                if (line.trim() === "" && measure(token) > width && !/^\s+$/.test(token)) {
                    // A word longer than the line breaks between its characters.
                    for (const char of token) {
                        if (line !== "" && measure(line + char) > width) {
                            lines.push(line);
                            line = "";
                        }
                        line += char;
                    }
                    continue;
                }
                line = line.trim() === "" && /^\s+$/.test(token) ? "" : candidate;
                continue;
            }
            lines.push(line.trimEnd());
            line = /^\s+$/.test(token) ? "" : token;
            if (measure(line) > width) {
                const chars = Array.from(line);
                line = "";
                for (const char of chars) {
                    if (line !== "" && measure(line + char) > width) {
                        lines.push(line);
                        line = "";
                    }
                    line += char;
                }
            }
        }
        lines.push(line.trimEnd());
    }
    if (lines.length <= maxLines) {
        return lines;
    }
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last !== "" && measure(`${last}…`) > width) {
        last = Array.from(last).slice(0, -1).join("");
    }
    kept[maxLines - 1] = `${last}…`;
    return kept;
}

/** Collects numbered objects and writes them with the cross-reference table that finds them. */
class PdfObjectWriter {
    readonly #encoder = new TextEncoder();
    readonly #objects: (Uint8Array | null)[] = [];

    public add(body: string): number {
        this.#objects.push(this.#encoder.encode(body));
        return this.#objects.length;
    }

    /** Adds a stream, compressed where the browser can, with extra entries for its dictionary. */
    public async addStream(entries: string, data: Uint8Array, extra = ""): Promise<number> {
        const compressed = await deflate(data);
        const content = compressed ?? data;
        const filter = compressed == null ? "" : " /Filter /FlateDecode";
        const head = this.#encoder.encode(`<< /Length ${content.length}${filter}${entries}${extra} >>\nstream\n`);
        const tail = this.#encoder.encode("\nendstream");
        const body = new Uint8Array(head.length + content.length + tail.length);
        body.set(head);
        body.set(content, head.length);
        body.set(tail, head.length + content.length);
        this.#objects.push(body);
        return this.#objects.length;
    }

    public finish(root: number, info: number): Uint8Array {
        const parts: Uint8Array[] = [];
        let offset = 0;
        const push = (part: Uint8Array): void => {
            parts.push(part);
            offset += part.length;
        };
        // The comment's high bytes tell transfer tools the file is binary.
        push(new Uint8Array([...this.#encoder.encode("%PDF-1.7\n%"), 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
        const offsets: number[] = [];
        this.#objects.forEach((body, index) => {
            offsets.push(offset);
            push(this.#encoder.encode(`${index + 1} 0 obj\n`));
            push(body ?? this.#encoder.encode("null"));
            push(this.#encoder.encode("\nendobj\n"));
        });
        const xref = offset;
        const id = randomId();
        push(
            this.#encoder.encode(
                `xref\n0 ${this.#objects.length + 1}\n0000000000 65535 f \n` +
                    offsets.map(value => `${String(value).padStart(10, "0")} 00000 n \n`).join("") +
                    `trailer\n<< /Size ${this.#objects.length + 1} /Root ${root} 0 R /Info ${info} 0 R ` +
                    `/ID [<${id}> <${id}>] >>\nstartxref\n${xref}\n%%EOF\n`
            )
        );
        const file = new Uint8Array(offset);
        let position = 0;
        for (const part of parts) {
            file.set(part, position);
            position += part.length;
        }
        return file;
    }

    /** Takes an object number now, for an object written later. */
    public reserve(): number {
        this.#objects.push(null);
        return this.#objects.length;
    }

    public set(id: number, body: string): void {
        this.#objects[id - 1] = this.#encoder.encode(body);
    }
}

/** Embeds the glyphs an embedded face used, as a Type 0 font with the text's characters for copying. */
async function writeEmbeddedFont(writer: PdfObjectWriter, face: EmbeddedFace): Promise<number> {
    const glyphs = [...face.used.keys()].sort((left, right) => left - right);
    const font = face.font;
    const name = `${subsetTag(glyphs)}+${font.postScriptName}`;
    const program = font.subset(glyphs);
    const file = await writer.addStream("", program, ` /Length1 ${program.length}`);
    const flags = 4 | (font.monospace ? 1 : 0) | (font.italicAngle !== 0 ? 64 : 0);
    const descriptor = writer.add(
        `<< /Type /FontDescriptor /FontName /${name} /Flags ${flags} /FontBBox [${font.bbox.join(" ")}] ` +
            `/ItalicAngle ${num(font.italicAngle)} /Ascent ${font.ascent} /Descent ${font.descent} ` +
            `/CapHeight ${font.capHeight} /StemV 80 /FontFile2 ${file} 0 R >>`
    );
    const widths: string[] = [];
    for (let index = 0; index < glyphs.length;) {
        const first = glyphs[index];
        const run: number[] = [];
        while (index < glyphs.length && glyphs[index] === first + run.length) {
            run.push(font.widthOf(glyphs[index]));
            index++;
        }
        widths.push(`${first} [${run.join(" ")}]`);
    }
    const cidFont = writer.add(
        `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${name} ` +
            `/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> ` +
            `/FontDescriptor ${descriptor} 0 R /W [${widths.join(" ")}] /CIDToGIDMap /Identity >>`
    );
    const toUnicode = await writer.addStream("", new TextEncoder().encode(toUnicodeCMap(face.used)));
    return writer.add(
        `<< /Type /Font /Subtype /Type0 /BaseFont /${name} /Encoding /Identity-H ` +
            `/DescendantFonts [${cidFont} 0 R] /ToUnicode ${toUnicode} 0 R >>`
    );
}

/** Maps each glyph back to its characters, so text copied or searched in the PDF is the text that was written. */
function toUnicodeCMap(used: ReadonlyMap<number, string>): string {
    const entries = [...used.entries()].sort(([left], [right]) => left - right);
    const blocks: string[] = [];
    for (let index = 0; index < entries.length; index += 100) {
        const block = entries.slice(index, index + 100);
        blocks.push(
            `${block.length} beginbfchar\n` +
                block.map(([glyph, text]) => `<${hex4(glyph)}> <${utf16Hex(text)}>`).join("\n") +
                `\nendbfchar`
        );
    }
    return (
        "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n" +
        "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n" +
        "/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n" +
        "1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n" +
        blocks.join("\n") +
        "\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend"
    );
}

/** Compresses with zlib's deflate, which PDF's FlateDecode reads; `null` where the browser can't. */
async function deflate(data: Uint8Array): Promise<Uint8Array | null> {
    if (typeof CompressionStream === "undefined") {
        return null;
    }
    try {
        const stream = new Blob([data as Uint8Array<ArrayBuffer>])
            .stream()
            .pipeThrough(new CompressionStream("deflate"));
        return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
        return null;
    }
}

function hex2(value: number): string {
    return value.toString(16).toUpperCase().padStart(2, "0");
}

function hex4(value: number): string {
    return value.toString(16).toUpperCase().padStart(4, "0");
}

/** A number as PDF writes it: at most two decimals, no exponent. */
function num(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return Object.is(rounded, -0) ? "0" : String(rounded);
}

function randomId(): string {
    const bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        crypto.getRandomValues(bytes);
    } else {
        for (let index = 0; index < bytes.length; index++) {
            bytes[index] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(bytes, hex2).join("");
}

/** Six capital letters that tell this subset of the font from others, as PDF asks of subset fonts. */
function subsetTag(glyphs: readonly number[]): string {
    let hash = 2166136261;
    for (const glyph of glyphs) {
        hash = Math.imul(hash ^ glyph, 16777619) >>> 0;
    }
    let tag = "";
    for (let index = 0; index < 6; index++) {
        tag += String.fromCharCode(65 + (hash % 26));
        hash = Math.floor(hash / 26) + index * 7919;
    }
    return tag;
}

/** A date as PDF writes dates: `D:YYYYMMDDHHmmSS` with the offset from UTC. */
function toPdfDate(date: Date): string {
    const pad = (value: number): string => String(value).padStart(2, "0");
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    return (
        `D:${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}` +
        `${sign}${pad(Math.floor(Math.abs(offset) / 60))}'${pad(Math.abs(offset) % 60)}'`
    );
}

/** Text for the document's information, such as its title: UTF-16 with a byte order mark, as a hex string. */
function toTextString(text: string): string {
    return `<FEFF${utf16Hex(text)}>`;
}

function utf16Hex(text: string): string {
    let hex = "";
    for (let index = 0; index < text.length; index++) {
        hex += hex4(text.charCodeAt(index));
    }
    return hex;
}
