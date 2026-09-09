export interface NumberSymbols {
    readonly decimal: string;
    readonly group: string;
    readonly minus: string;
    readonly digits: ReadonlyMap<string, string>;
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
        const digitMap = new Map<string, string>();

        // Seed digit map with common localized scripts as fallback
        for (let i = 0; i <= 9; i++) {
            digitMap.set(String(i), String(i));
            digitMap.set(String.fromCharCode(0x0660 + i), String(i)); // Arabic-Indic
            digitMap.set(String.fromCharCode(0x06f0 + i), String(i)); // Eastern Arabic-Indic / Persian
            digitMap.set(String.fromCharCode(0x09e6 + i), String(i)); // Bengali
        }

        try {
            const parts = new Intl.NumberFormat(localeId).formatToParts(-12345.6);
            const decimal = parts.find(p => p.type === "decimal")?.value ?? ".";
            const group = parts.find(p => p.type === "group")?.value ?? ",";
            const minus = parts.find(p => p.type === "minusSign")?.value ?? "-";

            // Dynamically query localized digit glyphs for this locale
            try {
                const digitFormatter = new Intl.NumberFormat(localeId, {
                    useGrouping: false,
                    maximumFractionDigits: 0
                });
                for (let i = 0; i <= 9; i++) {
                    const glyph = digitFormatter.format(i).replace(/[\u061C\u200E\u200F\s]/g, "");
                    if (glyph) {
                        digitMap.set(glyph, String(i));
                    }
                }
            } catch {
                // Ignore formatter failure
            }

            symbols = { decimal, group, minus, digits: digitMap };
        } catch {
            symbols = { decimal: ".", group: ",", minus: "-", digits: digitMap };
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

export function normalizeLocalizedDigits(text: string, localeId?: string): string {
    if (!text) {
        return text;
    }
    const symbols = localeId ? getNumberSymbols(localeId) : null;
    let result = "";
    for (const char of text) {
        if (symbols?.digits.has(char)) {
            result += symbols.digits.get(char)!;
        } else {
            const code = char.charCodeAt(0);
            if (code >= 0x0660 && code <= 0x0669) {
                result += String(code - 0x0660);
            } else if (code >= 0x06f0 && code <= 0x06f9) {
                result += String(code - 0x06f0);
            } else if (code >= 0x09e6 && code <= 0x09ef) {
                result += String(code - 0x09e6);
            } else {
                result += char;
            }
        }
    }
    return result;
}

export function normalizeLocalizedMinus(text: string, symbols?: NumberSymbols): string {
    if (!text) {
        return text;
    }
    let result = text
        .replace(/[\u2212\uFE63\uFF0D]/g, "-")
        .replace(/[\u061C\u200E\u200F]/g, "");
    if (symbols?.minus && symbols.minus !== "-") {
        result = result.replaceAll(symbols.minus, "-");
    }
    return result;
}

export function normalizeLocalizedInput(text: string, localeId: string): string {
    const symbols = getNumberSymbols(localeId);
    let cleaned = normalizeLocalizedMinus(text, symbols);
    cleaned = normalizeLocalizedDigits(cleaned, localeId);
    return cleaned;
}

export function parseLocalizedNumber(text: string | null | undefined, localeId: string): number | null {
    if (text == null) {
        return null;
    }
    let cleaned = String(text).trim();
    if (cleaned === "") {
        return null;
    }

    const symbols = getNumberSymbols(localeId);

    // Normalize minus signs, bidi controls, and localized digits
    cleaned = normalizeLocalizedMinus(cleaned, symbols);
    cleaned = normalizeLocalizedDigits(cleaned, localeId);

    if (cleaned === "-" || cleaned === "+") {
        return null;
    }

    // Remove all whitespace, non-breaking spaces, and Arabic thousands separator
    cleaned = cleaned.replace(/[\s\u00A0\u202F\u066C]/g, "");

    // Also remove grouping separator if present
    if (symbols.group && symbols.group !== ".") {
        cleaned = cleaned.replaceAll(symbols.group, "");
    }

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
        // Decimal separator is '.' or non-comma symbol (e.g. Arabic decimal separator '٫' U+066B)
        if (symbols.decimal !== ".") {
            cleaned = cleaned.replaceAll(symbols.decimal, ".");
        }
        // Also support Arabic decimal separator literal in case locale symbols differed
        cleaned = cleaned.replace(/\u066B/g, ".");
        // Support Persian '/' decimal separator if used
        if (cleaned.includes("/")) {
            cleaned = cleaned.replace(/\//g, ".");
        }
        cleaned = cleaned.replace(/,/g, "");
    }

    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
}
