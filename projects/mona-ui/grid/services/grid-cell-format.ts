import { formatDate } from "@angular/common";
import { formatGregorianDateToLocaleString } from "@nanahoshi/mona-ui/i18n";
import type { Column } from "../models/Column";

/** The locales a cell's value is formatted in. */
export interface GridCellFormatLocales {
    /** Angular's `LOCALE_ID`, which date format strings use. */
    readonly angularLocale: string;
    /** The Mona locale, which the default date format uses. */
    readonly localeId: string;
}

/**
 * A cell's value as the grid shows it: through the column's `format` when it has one, and dates in the locale's
 * numeric date format otherwise. Other values come back as they are.
 */
export function formatGridCellValue(
    value: unknown,
    rowData: Record<PropertyKey, unknown>,
    column: Column,
    locales: GridCellFormatLocales
): unknown {
    const format = column.format;
    if (format == null) {
        // A date shows in the locale's numeric date format, as the date picker and the filter row show it.
        return column.dataType === "date" && value instanceof Date && !Number.isNaN(value.getTime())
            ? formatGregorianDateToLocaleString(value, locales.localeId, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
              })
            : value;
    }
    if (typeof format === "function") {
        return format(value, rowData, column);
    }
    if (column.dataType === "date") {
        return formatDateValue(value, format, locales.angularLocale);
    }
    return value;
}

/** A cell's text as the grid shows it, for copying and printing; empty for no value. */
export function getGridCellText(
    rowData: Record<PropertyKey, unknown>,
    column: Column,
    locales: GridCellFormatLocales
): string {
    const formatted = formatGridCellValue(rowData[column.field], rowData, column, locales);
    return formatted == null ? "" : String(formatted);
}

function formatDateValue(value: unknown, format: string, locale: string): unknown {
    if (value == null) {
        return value;
    }
    if (value instanceof Date || typeof value === "number" || typeof value === "string") {
        try {
            return formatDate(value, format, locale);
        } catch {
            return value;
        }
    }
    return value;
}
