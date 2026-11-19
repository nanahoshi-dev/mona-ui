import { describe, expect, it } from "vitest";
import { type PdfDocumentOptions, type PdfTable, wrapText, writePdfTable } from "./grid-pdf";
import { parseTrueTypeFont } from "./grid-pdf-truetype";
import { createTestFont } from "./testing/create-test-font";
import { readPdf, shownText } from "./testing/read-pdf";

const OPTIONS: PdfDocumentOptions = {
    fontSize: 9,
    fonts: { bold: null, regular: null },
    margin: 36,
    modified: new Date(2024, 0, 3, 12, 30),
    pageSize: [595.28, 841.89],
    title: null
};

function table(rows: readonly (readonly string[])[], overrides: Partial<PdfTable> = {}): PdfTable {
    return {
        alignments: ["start", "end"],
        columnWidths: [160, 100],
        header: [
            [
                { firstColumn: 0, group: false, lastColumn: 0, rowSpan: 1, text: "Name" },
                { firstColumn: 1, group: false, lastColumn: 1, rowSpan: 1, text: "Amount" }
            ]
        ],
        rightToLeft: false,
        rows: rows.map(cells => ({ cells, indent: 0 })),
        treeColumn: null,
        ...overrides
    };
}

/** The page content streams in page order. */
async function pageStreams(data: Uint8Array): Promise<string[]> {
    const pdf = await readPdf(data);
    const pages = [...pdf.objects.entries()].filter(([, body]) => body.includes("/Type /Page "));
    return pages.map(([, body]) => pdf.streams.get(Number(/\/Contents (\d+) 0 R/.exec(body)![1]))!);
}

/** A measure where each character is as wide as given, for wrapping tests. */
const fixedWidth =
    (width: number) =>
    (text: string): number =>
        Array.from(text).length * width;

describe("writePdfTable", () => {
    it("writes a PDF whose cross-reference table finds every object", async () => {
        const data = await writePdfTable(table([["Ann", "10"]]), OPTIONS);
        const pdf = await readPdf(data);

        expect(pdf.text.startsWith("%PDF-1.7\n")).toBe(true);
        expect(pdf.text).toMatch(/\/Root 1 0 R \/Info 3 0 R \/ID \[<[0-9A-F]{32}> <[0-9A-F]{32}>\]/);
        expect(pdf.objects.get(1)).toBe("<< /Type /Catalog /Pages 2 0 R >>");
        expect(pdf.objects.get(3)).toContain("/CreationDate (D:20240103123000");
    });

    it("prints the header and the cells in Helvetica, and Windows-1252 characters as such", async () => {
        const [page] = await pageStreams(await writePdfTable(table([["Zoë – “café”", "1,234.5"]]), OPTIONS));

        expect(shownText(page)).toEqual(["Name", "Amount", "Zoë – “café”", "1,234.5", "1 / 1"]);
        expect(page).toContain("/F2 9 Tf");
    });

    it("prints characters Helvetica hasn't as question marks when there's no font to embed", async () => {
        const [page] = await pageStreams(await writePdfTable(table([["漢字", "1"]]), OPTIONS));

        expect(shownText(page)).toContain("??");
    });

    it("aligns number columns to the end of their cells", async () => {
        const [page] = await pageStreams(await writePdfTable(table([["A", "1"]]), OPTIONS));
        const positions = Array.from(page.matchAll(/1 0 0 1 ([\d.]+) [\d.]+ Tm <([0-9A-F]+)> Tj/g)).map(match => ({
            text: match[2],
            x: Number(match[1])
        }));
        // "1" is drawn near the right edge of the 75-point Amount column, which starts at 36 + 120.
        const one = positions.find(position => position.text === "31")!;

        expect(one.x).toBeGreaterThan(36 + 120 + 60);
    });

    it("starts a new page with the header again when the rows don't fit", async () => {
        const rows = Array.from({ length: 120 }, (_, index) => [`Row ${index + 1}`, String(index)]);
        const data = await writePdfTable(table(rows), OPTIONS);
        const pages = await pageStreams(data);
        const pdf = await readPdf(data);

        expect(pages.length).toBeGreaterThan(1);
        expect(pdf.objects.get(2)).toContain(`/Count ${pages.length}`);
        for (const [index, page] of pages.entries()) {
            expect(shownText(page).slice(0, 2)).toEqual(["Name", "Amount"]);
            expect(shownText(page).at(-1)).toBe(`${index + 1} / ${pages.length}`);
        }
        expect(pages.flatMap(page => shownText(page)).filter(text => text.startsWith("Row "))).toHaveLength(120);
    });

    it("puts the title above the table on the first page and in the document's information", async () => {
        const data = await writePdfTable(table([["A", "1"]]), { ...OPTIONS, title: "Orders" });
        const [page] = await pageStreams(data);
        const pdf = await readPdf(data);

        expect(shownText(page)[0]).toBe("Orders");
        expect(pdf.objects.get(3)).toContain("/Title <FEFF004F00720064006500720073>");
    });

    it("runs the columns from right to left", async () => {
        const [page] = await pageStreams(await writePdfTable(table([["A", "1"]], { rightToLeft: true }), OPTIONS));
        const x = (hex: string): number =>
            Number(new RegExp(`1 0 0 1 ([\\d.]+) [\\d.]+ Tm <${hex}> Tj`).exec(page)![1]);

        // "Name" (first column) is to the right of "Amount".
        expect(x("4E616D65")).toBeGreaterThan(x("416D6F756E74"));
    });

    it("indents the tree column's text by level", async () => {
        const tree = table([], {
            rows: [
                { cells: ["Root", "1"], indent: 0 },
                { cells: ["Child", "2"], indent: 1 }
            ],
            treeColumn: 0
        });
        const [page] = await pageStreams(await writePdfTable(tree, OPTIONS));
        const x = (hex: string): number =>
            Number(new RegExp(`1 0 0 1 ([\\d.]+) [\\d.]+ Tm <${hex}> Tj`).exec(page)![1]);

        expect(x("4368696C64") - x("526F6F74")).toBeCloseTo(10, 0);
    });

    it("shrinks a table wider than the page to fit, text and all", async () => {
        const wide = table([["A", "1"]], { columnWidths: [1200, 400] });
        const [page] = await pageStreams(await writePdfTable(wide, OPTIONS));
        const sizes = Array.from(page.matchAll(/\/F1 ([\d.]+) Tf/g)).map(match => Number(match[1]));

        expect(Math.max(...sizes)).toBeLessThan(9);
        expect(Math.max(...sizes)).toBeGreaterThanOrEqual(5);
    });

    describe("with an embedded font", () => {
        const font = parseTrueTypeFont(
            createTestFont({
                glyphs: [
                    { codePoint: 0x6f22, width: 1000 },
                    { codePoint: 0x5b57, width: 1000 },
                    { codePoint: 0x41, width: 600 }
                ]
            })
        );

        it("embeds the font's used glyphs as a Type 0 font, and maps them back to their characters", async () => {
            // "Amount" in the bold header draws A in the same font, thickened.
            const data = await writePdfTable(table([["漢字", "1"]]), {
                ...OPTIONS,
                fonts: { bold: null, regular: font }
            });
            const pdf = await readPdf(data);
            const [page] = await pageStreams(data);

            const type0 = [...pdf.objects.values()].find(body => body.includes("/Subtype /Type0"))!;
            expect(type0).toMatch(/\/BaseFont \/[A-Z]{6}\+MonaTest-Regular \/Encoding \/Identity-H/);
            expect(
                [...pdf.objects.values()].some(
                    body => body.includes("/CIDFontType2") && body.includes("/W [1 [1000 1000 600]]")
                )
            ).toBe(true);
            expect([...pdf.objects.values()].some(body => body.includes("/Length1"))).toBe(true);
            expect(page).toContain("<00010002> Tj");
            const toUnicode = [...pdf.streams.values()].find(stream => stream.includes("beginbfchar"))!;
            expect(toUnicode).toContain("<0001> <6F22>");
            expect(toUnicode).toContain("<0002> <5B57>");
        });

        it("falls back to Helvetica for characters the font hasn't, and to a question mark for ones neither has", async () => {
            const data = await writePdfTable(table([["A漢é한", "1"]]), {
                ...OPTIONS,
                fonts: { bold: null, regular: font }
            });
            const [page] = await pageStreams(data);
            const pdf = await readPdf(data);

            // A and 漢 are in the font; é isn't, so it's printed in Helvetica, and neither has 한.
            expect(page).toMatch(/\/F3 9 Tf .*<00030001> Tj/);
            expect(shownText(page)).toContain("é?");
            const toUnicode = [...pdf.streams.values()].find(stream => stream.includes("beginbfchar"))!;
            expect(toUnicode.slice(toUnicode.indexOf("beginbfchar"))).not.toContain("<0000>");
        });

        it("draws bold text with the regular face thickened when there's no bold face, and keeps its glyphs", async () => {
            const header = table([["A", "1"]], {
                header: [[{ firstColumn: 0, group: false, lastColumn: 1, rowSpan: 1, text: "漢" }]]
            });
            const data = await writePdfTable(header, { ...OPTIONS, fonts: { bold: null, regular: font } });
            const [page] = await pageStreams(data);
            const pdf = await readPdf(data);

            expect(page).toMatch(/\/F3 9 Tf 2 Tr [\d.]+ w 1 0 0 1 [\d.]+ [\d.]+ Tm <0001> Tj 0 Tr/);
            // 漢 is only in the bold header, and still in the subset's text map.
            const toUnicode = [...pdf.streams.values()].find(stream => stream.includes("beginbfchar"))!;
            expect(toUnicode).toContain("<0001> <6F22>");
            expect(toUnicode).toContain("<0003> <0041>");
        });
    });
});

describe("wrapText", () => {
    it("breaks at spaces", () => {
        expect(wrapText("one two three", 7, fixedWidth(1))).toEqual(["one two", "three"]);
    });

    it("breaks between CJK characters, which have no spaces", () => {
        expect(wrapText("漢字漢字漢", 2, fixedWidth(1))).toEqual(["漢字", "漢字", "漢"]);
    });

    it("breaks inside a word that's longer than the line", () => {
        expect(wrapText("abcdefgh ij", 3, fixedWidth(1))).toEqual(["abc", "def", "gh", "ij"]);
    });

    it("keeps line breaks in the text", () => {
        expect(wrapText("a\nb", 10, fixedWidth(1))).toEqual(["a", "b"]);
    });

    it("ends the last line that fits with an ellipsis", () => {
        expect(wrapText("one two three four", 7, fixedWidth(1), 2)).toEqual(["one two", "three…"]);
    });
});
