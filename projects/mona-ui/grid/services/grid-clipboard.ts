import type { DataType } from "@nanahoshi/mona-ui/common";
import { parseLocalizedNumber } from "@nanahoshi/mona-ui/i18n";

/** A pasted value the column can hold, or `null` when the text doesn't fit the column's type. */
export type GridPastedValue = { readonly value: unknown } | null;

/**
 * Cells as tab-separated text, a row per line, as spreadsheets copy them. A cell with a tab, a line break or a
 * double quote is quoted, with its quotes doubled.
 */
export function toClipboardText(rows: readonly (readonly string[])[]): string {
    return rows.map(row => row.map(quoteCell).join("\t")).join("\r\n");
}

/**
 * Tab-separated text as rows of cells, the way spreadsheets put cells on the clipboard: quoted cells may hold tabs,
 * line breaks and doubled quotes, and the line break after the last row is ignored.
 */
export function parseClipboardText(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let index = 0;
    const length = text.length;
    while (index < length) {
        const char = text[index];
        if (char === '"' && cell === "") {
            // A quoted cell runs to the quote that isn't doubled.
            let end = index + 1;
            let value = "";
            let closed = false;
            while (end < length) {
                if (text[end] === '"') {
                    if (text[end + 1] === '"') {
                        value += '"';
                        end += 2;
                        continue;
                    }
                    closed = true;
                    break;
                }
                value += text[end];
                end++;
            }
            const next = text[end + 1];
            if (closed && (next === undefined || next === "\t" || next === "\r" || next === "\n")) {
                cell = value;
                index = end + 1;
                continue;
            }
            // A quote that doesn't wrap the whole cell is just a character.
        }
        if (char === "\t") {
            row.push(cell);
            cell = "";
        } else if (char === "\r" || char === "\n") {
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
            if (char === "\r" && text[index + 1] === "\n") {
                index++;
            }
        } else {
            cell += char;
        }
        index++;
    }
    if (cell !== "" || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }
    return rows;
}

/**
 * Pasted text as a value of the column's type. Numbers and dates are read in the locale, as the grid shows them,
 * and dates also as ISO `YYYY-MM-DD`; true/false values as `true`/`false`, `yes`/`no` or `1`/`0`. Empty text clears
 * a number, date or true/false cell.
 */
export function parsePastedValue(text: string, dataType: DataType, localeId: string): GridPastedValue {
    const trimmed = text.trim();
    switch (dataType) {
        case "number": {
            if (trimmed === "") {
                return { value: null };
            }
            const value = parseLocalizedNumber(trimmed, localeId);
            return value == null ? null : { value };
        }
        case "boolean": {
            if (trimmed === "") {
                return { value: null };
            }
            if (/^(true|yes|1)$/i.test(trimmed)) {
                return { value: true };
            }
            return /^(false|no|0)$/i.test(trimmed) ? { value: false } : null;
        }
        case "date": {
            if (trimmed === "") {
                return { value: null };
            }
            const value = parseIsoDate(trimmed) ?? parseLocaleNumericDate(trimmed, localeId);
            return value == null ? null : { value };
        }
        default:
            return { value: text };
    }
}

/** A date written as the locale writes numeric dates, such as `03/01/2024` or `2024/01/03`. */
function parseLocaleNumericDate(text: string, localeId: string): Date | null {
    const groups = normalizeDigits(text, localeId).match(/\d+/g);
    if (groups == null || groups.length !== 3) {
        return null;
    }
    let order: string[];
    try {
        order = new Intl.DateTimeFormat(localeId, {
            calendar: "gregory",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        })
            .formatToParts(new Date(2001, 10, 22))
            .map(part => part.type)
            .filter(type => type === "day" || type === "month" || type === "year");
    } catch {
        return null;
    }
    if (order.length !== 3) {
        return null;
    }
    const parts = new Map(order.map((type, index) => [type, Number(groups[index])] as const));
    return toLocalDate(parts.get("year")!, parts.get("month")!, parts.get("day")!);
}

/** `YYYY-MM-DD`, optionally with a time, as the local calendar date. */
function parseIsoDate(text: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(text);
    return match == null ? null : toLocalDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** The locale's own digits, such as Arabic-Indic ones, as ASCII digits. */
function normalizeDigits(text: string, localeId: string): string {
    let digits: string[];
    try {
        const format = new Intl.NumberFormat(localeId, { useGrouping: false });
        digits = Array.from({ length: 10 }, (_, digit) => format.format(digit));
    } catch {
        return text;
    }
    return Array.from(text, char => {
        const digit = digits.indexOf(char);
        return digit < 0 ? char : String(digit);
    }).join("");
}

function quoteCell(text: string): string {
    return /[\t\r\n"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A local calendar date, or `null` when the parts don't name a real day. */
function toLocalDate(year: number, month: number, day: number): Date | null {
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }
    const date = new Date(year, month - 1, day);
    // A day past the month's end rolls into the next month; that isn't the date that was typed.
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
