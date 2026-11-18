import { toColumnName, toExcelDate, toSheetName, writeXlsx, type XlsxSheet } from "./grid-xlsx";
import { readZip } from "./testing/read-zip";

const SPREADSHEET_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

function sheet(overrides: Partial<XlsxSheet> = {}): XlsxSheet {
    return {
        columnWidths: [],
        frozenColumns: 0,
        frozenRows: 0,
        merges: [],
        name: "Sheet",
        rightToLeft: false,
        rows: [],
        ...overrides
    };
}

async function worksheet(overrides: Partial<XlsxSheet>): Promise<Document> {
    const files = await readZip(await writeXlsx(sheet(overrides)));
    return new DOMParser().parseFromString(files.get("xl/worksheets/sheet1.xml") ?? "", "application/xml");
}

function cell(document: Document, reference: string): Element | null {
    return (
        Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "c")).find(
            candidate => candidate.getAttribute("r") === reference
        ) ?? null
    );
}

describe("writeXlsx", () => {
    it("names columns as spreadsheets do", () => {
        expect([0, 25, 26, 51, 52, 701, 702].map(toColumnName)).toEqual(["A", "Z", "AA", "AZ", "BA", "ZZ", "AAA"]);
    });

    it("counts dates from the spreadsheet epoch, by the local calendar day", () => {
        expect(toExcelDate(new Date(2024, 0, 3, 23, 30))).toBe(45294);
        expect(toExcelDate(new Date(1900, 2, 1))).toBe(61);
        expect(toExcelDate(new Date(Number.NaN))).toBeNull();
    });

    it("makes a name a sheet can have", () => {
        expect(toSheetName("Q1/Q2: [orders]?")).toBe("Q1 Q2 orders");
        expect(toSheetName("'quoted'")).toBe("quoted");
        expect(toSheetName("a".repeat(40))).toHaveLength(31);
        expect(toSheetName("  ")).toBe("Sheet1");
        expect(toSheetName("History")).toBe("Sheet1");
    });

    it("writes the parts a workbook needs, with the sheet's name", async () => {
        const files = await readZip(await writeXlsx(sheet({ name: "Orders & more" })));

        expect([...files.keys()].sort()).toEqual([
            "[Content_Types].xml",
            "_rels/.rels",
            "xl/_rels/workbook.xml.rels",
            "xl/styles.xml",
            "xl/workbook.xml",
            "xl/worksheets/sheet1.xml"
        ]);
        expect(files.get("xl/workbook.xml")).toContain(`<sheet name="Orders &amp; more" sheetId="1" r:id="rId1"/>`);
        for (const xml of files.values()) {
            const document = new DOMParser().parseFromString(xml, "application/xml");
            expect(document.getElementsByTagName("parsererror")).toHaveLength(0);
        }
    });

    it("keeps numbers, true/false and dates typed, and text as text", async () => {
        const document = await worksheet({
            rows: [
                [
                    { value: 3.5 },
                    { value: true },
                    { value: new Date(2024, 11, 31) },
                    { value: '=HYPERLINK("x")' },
                    { value: " padded <b>&amp; " },
                    { value: null },
                    { value: Number.NaN }
                ]
            ]
        });

        expect(cell(document, "A1")?.getAttribute("t")).toBeNull();
        expect(cell(document, "A1")?.textContent).toBe("3.5");
        expect(cell(document, "B1")?.getAttribute("t")).toBe("b");
        expect(cell(document, "B1")?.textContent).toBe("1");
        expect(cell(document, "C1")?.getAttribute("s")).toBe("3");
        expect(cell(document, "C1")?.textContent).toBe("45657");
        // Inline text isn't a formula, so it's written as it is, with no quote in front.
        expect(cell(document, "D1")?.getAttribute("t")).toBe("inlineStr");
        expect(cell(document, "D1")?.textContent).toBe('=HYPERLINK("x")');
        const padded = cell(document, "E1")?.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "t")[0];
        expect(padded?.textContent).toBe(" padded <b>&amp; ");
        expect(padded?.getAttribute("xml:space")).toBe("preserve");
        expect(cell(document, "F1")).toBeNull();
        expect(cell(document, "G1")).toBeNull();
    });

    it("drops characters XML can't hold, and cuts text at the cell limit", async () => {
        const document = await worksheet({
            rows: [[{ value: "a\u0000b\u001Fc\uD800" }, { value: "x".repeat(40000) }]]
        });

        expect(cell(document, "A1")?.textContent).toBe("abc");
        expect(cell(document, "B1")?.textContent).toHaveLength(32767);
    });

    it("writes styles, merges, widths, the frozen pane and the reading direction", async () => {
        const document = await worksheet({
            columnWidths: [100, null, 40],
            frozenColumns: 1,
            frozenRows: 2,
            merges: [{ firstColumn: 1, firstRow: 0, lastColumn: 2, lastRow: 0 }],
            rightToLeft: true,
            rows: [
                [
                    { style: "header", value: "Id" },
                    { style: "group", value: "Contact" }
                ],
                [null, { style: "header", value: "Email" }, { style: "header", value: "Phone" }]
            ]
        });

        expect(cell(document, "A1")?.getAttribute("s")).toBe("1");
        expect(cell(document, "B1")?.getAttribute("s")).toBe("2");
        const merges = Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "mergeCell"));
        expect(merges.map(merge => merge.getAttribute("ref"))).toEqual(["B1:C1"]);
        const columns = Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "col"));
        expect(columns.map(column => [column.getAttribute("min"), column.getAttribute("width")])).toEqual([
            ["1", "13.57"],
            ["3", "5"]
        ]);
        const view = document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "sheetView")[0];
        expect(view.getAttribute("rightToLeft")).toBe("1");
        const pane = document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "pane")[0];
        expect(pane.getAttribute("xSplit")).toBe("1");
        expect(pane.getAttribute("ySplit")).toBe("2");
        expect(pane.getAttribute("topLeftCell")).toBe("B3");
        expect(pane.getAttribute("activePane")).toBe("bottomRight");
        expect(pane.getAttribute("state")).toBe("frozen");
        expect(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "dimension")[0].getAttribute("ref")).toBe(
            "A1:C2"
        );
    });

    it("freezes only rows when no column is frozen", async () => {
        const document = await worksheet({ frozenRows: 1, rows: [[{ value: "Id" }]] });

        const pane = document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "pane")[0];
        expect(pane.getAttribute("xSplit")).toBeNull();
        expect(pane.getAttribute("activePane")).toBe("bottomLeft");
        expect(pane.getAttribute("topLeftCell")).toBe("A2");
    });
});
