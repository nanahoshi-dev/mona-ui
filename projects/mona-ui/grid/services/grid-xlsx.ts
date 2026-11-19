import { createZip } from "./grid-zip";

/** A cell's value: numbers, true/false and dates keep their type in the spreadsheet; `null` leaves the cell empty. */
export type XlsxCellValue = boolean | Date | number | string | null;

/** How a cell looks: `header` for a column title, `group` for a column group's title. */
export type XlsxCellStyle = "group" | "header";

export interface XlsxCell {
    /** How many steps the text is indented from the cell's start, as a tree's levels are; at most 15. */
    readonly indent?: number;
    readonly style?: XlsxCellStyle;
    readonly value: XlsxCellValue;
}

/** Cells shown as one, from 0-based row and column indices, both ends included. */
export interface XlsxMerge {
    readonly firstColumn: number;
    readonly firstRow: number;
    readonly lastColumn: number;
    readonly lastRow: number;
}

export interface XlsxSheet {
    /** Each column's width in CSS pixels, or `null` for the spreadsheet's default. */
    readonly columnWidths: readonly (number | null)[];
    /** How many columns from the start stay in view while the sheet scrolls sideways. */
    readonly frozenColumns: number;
    /** How many rows from the top stay in view while the sheet scrolls down. */
    readonly frozenRows: number;
    readonly merges: readonly XlsxMerge[];
    /** The sheet's tab name; characters a sheet name can't have are dropped. */
    readonly name: string;
    /** Whether the sheet reads from right to left, with column A on the right. */
    readonly rightToLeft: boolean;
    /**
     * Each row's outline level, by row index, for a tree: 0 or left out for none. Rows with a higher level fold
     * under the row above them; at most 7.
     */
    readonly rowOutlineLevels?: readonly number[];
    /** The rows from the top; a `null` cell, or a missing one, is empty. */
    readonly rows: readonly (readonly (XlsxCell | null | undefined)[])[];
}

export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** The most characters a cell can hold. */
const MAX_CELL_TEXT_LENGTH = 32767;
const MAX_SHEET_NAME_LENGTH = 31;
const MAX_INDENT = 15;
const MAX_OUTLINE_LEVEL = 7;
/** The width of a digit in the default font (Calibri 11), in pixels: the unit of column widths. */
const MAX_DIGIT_WIDTH = 7;
const MILLISECONDS_PER_DAY = 86_400_000;
/** Day 0 of the 1900 date system as Excel counts it, which skips the 29 February 1900 that never was. */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

const SPREADSHEET_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PACKAGE_RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/package/2006/relationships";
const XML_DECLARATION = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;

/** The `cellXfs` index of each look, in the order `styles.xml` lists them. Indents follow, one style per step. */
const STYLE_INDEX = { date: 3, group: 2, header: 1 } as const;
const FIRST_INDENT_STYLE_INDEX = 4;

/** Builds an `.xlsx` workbook with one sheet. */
export async function writeXlsx(sheet: XlsxSheet): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const files: readonly (readonly [string, string])[] = [
        ["[Content_Types].xml", contentTypesXml()],
        ["_rels/.rels", rootRelationshipsXml()],
        ["xl/workbook.xml", workbookXml(toSheetName(sheet.name))],
        ["xl/_rels/workbook.xml.rels", workbookRelationshipsXml()],
        ["xl/styles.xml", stylesXml(maxIndent(sheet))],
        ["xl/worksheets/sheet1.xml", worksheetXml(sheet)]
    ];
    return createZip(files.map(([name, xml]) => ({ data: encoder.encode(xml), name })));
}

/** The spreadsheet's column name for a 0-based index: A, B, …, Z, AA, AB, … */
export function toColumnName(index: number): string {
    let name = "";
    for (let remaining = index + 1; remaining > 0; remaining = Math.floor((remaining - 1) / 26)) {
        name = String.fromCharCode(65 + ((remaining - 1) % 26)) + name;
    }
    return name;
}

/** The serial number a spreadsheet stores for the local calendar date of a `Date`, or `null` when it's invalid. */
export function toExcelDate(value: Date): number | null {
    if (Number.isNaN(value.getTime())) {
        return null;
    }
    return (Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) - EXCEL_EPOCH) / MILLISECONDS_PER_DAY;
}

/** A name a sheet can have: no `\ / ? * [ ] :`, no apostrophe at either end, at most 31 characters. */
export function toSheetName(name: string): string {
    const cleaned = Array.from(name.replace(/[\\/?*[\]:]/g, " ").replace(/\s+/g, " "))
        .slice(0, MAX_SHEET_NAME_LENGTH)
        .join("")
        .replace(/^['\s]+|['\s]+$/g, "");
    return cleaned === "" || cleaned.toLowerCase() === "history" ? "Sheet1" : cleaned;
}

function cellXml(cell: XlsxCell, reference: string): string {
    const value = cell.value;
    const indent = toIndent(cell.indent);
    const styleIndex =
        cell.style != null ? STYLE_INDEX[cell.style] : indent > 0 ? FIRST_INDENT_STYLE_INDEX + indent - 1 : null;
    const style = styleIndex == null ? "" : ` s="${styleIndex}"`;
    if (value == null) {
        return style === "" ? "" : `<c r="${reference}"${style}/>`;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? `<c r="${reference}"${style}><v>${value}</v></c>` : "";
    }
    if (typeof value === "boolean") {
        return `<c r="${reference}"${style} t="b"><v>${value ? 1 : 0}</v></c>`;
    }
    if (value instanceof Date) {
        const serial = toExcelDate(value);
        return serial == null ? "" : `<c r="${reference}" s="${STYLE_INDEX.date}"><v>${serial}</v></c>`;
    }
    // Inline text is only ever text: a value starting with "=" stays a value, so there's no formula to escape. A cut
    // through a surrogate pair leaves half of it, which escaping drops.
    const text = escapeXml(value.length > MAX_CELL_TEXT_LENGTH ? value.slice(0, MAX_CELL_TEXT_LENGTH) : value);
    const space = /^\s|\s$/.test(text) ? ` xml:space="preserve"` : "";
    return `<c r="${reference}"${style} t="inlineStr"><is><t${space}>${text}</t></is></c>`;
}

function contentTypesXml(): string {
    return (
        XML_DECLARATION +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`
    );
}

/** Escapes text for XML, and drops the control characters XML 1.0 can't hold. */
function escapeXml(text: string): string {
    return (
        text
            // eslint-disable-next-line no-control-regex
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
            .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
    );
}

/** The deepest indent of any cell, which sets how many indent styles the workbook needs. */
function maxIndent(sheet: XlsxSheet): number {
    let deepest = 0;
    for (const row of sheet.rows) {
        for (const cell of row) {
            deepest = Math.max(deepest, toIndent(cell?.indent));
        }
    }
    return deepest;
}

function rootRelationshipsXml(): string {
    return (
        XML_DECLARATION +
        `<Relationships xmlns="${PACKAGE_RELATIONSHIP_NAMESPACE}">` +
        `<Relationship Id="rId1" Type="${RELATIONSHIP_NAMESPACE}/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`
    );
}

function sheetViewXml(sheet: XlsxSheet): string {
    const rightToLeft = sheet.rightToLeft ? ` rightToLeft="1"` : "";
    const columns = Math.max(0, sheet.frozenColumns);
    const rows = Math.max(0, sheet.frozenRows);
    if (columns === 0 && rows === 0) {
        return `<sheetViews><sheetView workbookViewId="0"${rightToLeft}/></sheetViews>`;
    }
    const pane = columns !== 0 && rows !== 0 ? "bottomRight" : rows !== 0 ? "bottomLeft" : "topRight";
    const split = (columns === 0 ? "" : ` xSplit="${columns}"`) + (rows === 0 ? "" : ` ySplit="${rows}"`);
    const topLeft = `${toColumnName(columns)}${rows + 1}`;
    return (
        `<sheetViews><sheetView workbookViewId="0"${rightToLeft}>` +
        `<pane${split} topLeftCell="${topLeft}" activePane="${pane}" state="frozen"/>` +
        `<selection pane="${pane}" activeCell="${topLeft}" sqref="${topLeft}"/>` +
        `</sheetView></sheetViews>`
    );
}

function stylesXml(indents: number): string {
    const font = `<sz val="11"/><name val="Calibri"/><family val="2"/>`;
    const indentStyles = Array.from(
        { length: indents },
        (_, index) =>
            `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">` +
            `<alignment indent="${index + 1}"/></xf>`
    ).join("");
    return (
        XML_DECLARATION +
        `<styleSheet xmlns="${SPREADSHEET_NAMESPACE}">` +
        `<fonts count="2"><font>${font}</font><font><b/>${font}</font></fonts>` +
        `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
        `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
        `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
        `<cellXfs count="${FIRST_INDENT_STYLE_INDEX + indents}">` +
        `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
        `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
        `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center"/></xf>` +
        // 14 is the built-in short date, which each spreadsheet shows in its user's own date format.
        `<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
        indentStyles +
        `</cellXfs>` +
        `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
        `</styleSheet>`
    );
}

/** An indent a cell style can have: a whole number from 0 to 15. */
function toIndent(indent: number | undefined): number {
    return indent == null || !Number.isFinite(indent) ? 0 : Math.min(MAX_INDENT, Math.max(0, Math.floor(indent)));
}

/** A CSS pixel width as a spreadsheet column width, in widths of a digit. */
function toColumnWidth(pixels: number): number {
    return Math.max(0, Math.round(((pixels - 5) / MAX_DIGIT_WIDTH) * 100) / 100);
}

function workbookRelationshipsXml(): string {
    return (
        XML_DECLARATION +
        `<Relationships xmlns="${PACKAGE_RELATIONSHIP_NAMESPACE}">` +
        `<Relationship Id="rId1" Type="${RELATIONSHIP_NAMESPACE}/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="${RELATIONSHIP_NAMESPACE}/styles" Target="styles.xml"/>` +
        `</Relationships>`
    );
}

function workbookXml(sheetName: string): string {
    return (
        XML_DECLARATION +
        `<workbook xmlns="${SPREADSHEET_NAMESPACE}" xmlns:r="${RELATIONSHIP_NAMESPACE}">` +
        `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
        `</workbook>`
    );
}

function worksheetXml(sheet: XlsxSheet): string {
    const columnCount = Math.max(sheet.columnWidths.length, ...sheet.rows.map(row => row.length), 1);
    const rowCount = Math.max(sheet.rows.length, 1);
    const dimension = `A1:${toColumnName(columnCount - 1)}${rowCount}`;
    const columns = sheet.columnWidths
        .map((width, index) =>
            width == null
                ? ""
                : `<col min="${index + 1}" max="${index + 1}" width="${toColumnWidth(width)}" customWidth="1"/>`
        )
        .join("");
    const rows = sheet.rows
        .map((row, rowIndex) => {
            const cells = row
                .map((cell, columnIndex) =>
                    cell == null ? "" : cellXml(cell, `${toColumnName(columnIndex)}${rowIndex + 1}`)
                )
                .join("");
            if (cells === "") {
                return "";
            }
            const level = Math.min(MAX_OUTLINE_LEVEL, Math.max(0, Math.floor(sheet.rowOutlineLevels?.[rowIndex] ?? 0)));
            const outline = level > 0 ? ` outlineLevel="${level}"` : "";
            return `<row r="${rowIndex + 1}"${outline}>${cells}</row>`;
        })
        .join("");
    const deepestOutline = (sheet.rowOutlineLevels ?? []).reduce(
        (deepest, level) => Math.max(deepest, Math.min(MAX_OUTLINE_LEVEL, Math.floor(level))),
        0
    );
    const merges =
        sheet.merges.length === 0
            ? ""
            : `<mergeCells count="${sheet.merges.length}">` +
              sheet.merges
                  .map(
                      merge =>
                          `<mergeCell ref="${toColumnName(merge.firstColumn)}${merge.firstRow + 1}:` +
                          `${toColumnName(merge.lastColumn)}${merge.lastRow + 1}"/>`
                  )
                  .join("") +
              `</mergeCells>`;
    // The order of these elements is fixed by the schema; spreadsheets reject the file otherwise.
    return (
        XML_DECLARATION +
        `<worksheet xmlns="${SPREADSHEET_NAMESPACE}" xmlns:r="${RELATIONSHIP_NAMESPACE}">` +
        // A tree's parent row sits above its children, so the outline's toggle goes above them too.
        (deepestOutline > 0 ? `<sheetPr><outlinePr summaryBelow="0"/></sheetPr>` : "") +
        `<dimension ref="${dimension}"/>` +
        sheetViewXml(sheet) +
        `<sheetFormatPr defaultRowHeight="15"${deepestOutline > 0 ? ` outlineLevelRow="${deepestOutline}"` : ""}/>` +
        (columns === "" ? "" : `<cols>${columns}</cols>`) +
        `<sheetData>${rows}</sheetData>` +
        merges +
        `</worksheet>`
    );
}
