export interface NumberSymbols {
    decimal: string;
    group: string;
    minus: string;
}

const numberSymbolsCache = new Map<string, NumberSymbols>();
const numberFormatterCache = new Map<string, Intl.NumberFormat>();

function serializeOptions(options?: Intl.NumberFormatOptions): string {
    if (!options) {
        return "";
    }
    const keys = Object.keys(options).sort();
    return keys.map(k => `${k}:${String((options as Record<string, unknown>)[k])}`).join(";");
}

export function getNumberSymbols(localeId: string): NumberSymbols {
    let symbols = numberSymbolsCache.get(localeId);
    if (!symbols) {
        try {
            const parts = new Intl.NumberFormat(localeId).formatToParts(-12345.6);
            const decimal = parts.find(p => p.type === "decimal")?.value ?? ".";
            const group = parts.find(p => p.type === "group")?.value ?? ",";
            const minus = parts.find(p => p.type === "minusSign")?.value ?? "-";
            symbols = { decimal, group, minus };
        } catch {
            symbols = { decimal: ".", group: ",", minus: "-" };
        }
        numberSymbolsCache.set(localeId, symbols);
    }
    return symbols;
}

export function getNumberFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = `${locale}:${serializeOptions(options)}`;
    let formatter = numberFormatterCache.get(key);
    if (!formatter) {
        formatter = new Intl.NumberFormat(locale, options);
        numberFormatterCache.set(key, formatter);
    }
    return formatter;
}

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
    return getNumberFormatter(locale, options).format(value);
}

export function parseLocalizedNumber(text: string | null | undefined, localeId: string): number | null {
    if (text == null) {
        return null;
    }
    let cleaned = String(text).trim();
    if (cleaned === "") {
        return null;
    }

    // Normalize minus signs and strip bidi controls
    cleaned = cleaned
        .replace(/[\u2212\uFE63\uFF0D]/g, "-")
        .replace(/[\u061C\u200E\u200F]/g, "");

    if (cleaned === "-" || cleaned === "+") {
        return null;
    }

    const symbols = getNumberSymbols(localeId);

    // Remove all whitespace and non-breaking spaces
    cleaned = cleaned.replace(/[\s\u00A0\u202F]/g, "");

    if (symbols.decimal === ",") {
        if (cleaned.includes(",")) {
            // Comma is the decimal separator, dots are group separators
            cleaned = cleaned.replace(/\./g, "").replace(",", ".");
        } else if (cleaned.includes(".")) {
            // No comma, but dot is present
            const dotParts = cleaned.split(".");
            if (dotParts.length > 2) {
                // Multiple dots => group separators (e.g. 1.000.000)
                cleaned = cleaned.replace(/\./g, "");
            } else if (dotParts[1].length !== 3) {
                // Single dot not followed by exactly 3 digits => numpad dot (e.g. 12.5)
            } else {
                // Single dot followed by exactly 3 digits => group separator (e.g. 1.234)
                cleaned = cleaned.replace(/\./g, "");
            }
        }
    } else {
        // Decimal separator is '.' or non-comma symbol
        if (symbols.decimal !== ".") {
            cleaned = cleaned.replace(new RegExp(`\\${symbols.decimal}`, "g"), ".");
        }
        if (symbols.group && symbols.group !== ".") {
            cleaned = cleaned.replace(new RegExp(`\\${symbols.group}`, "g"), "");
        } else {
            cleaned = cleaned.replace(/,/g, "");
        }
    }

    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
}
