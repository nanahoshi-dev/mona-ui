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

export type LocalizedNumberParseMode = "edit" | "locale";

export interface ParseLocalizedNumberOptions {
    /**
     * When "locale" (default), parses strictly according to canonical locale rules.
     * Only the locale's canonical decimal separator is treated as decimal, and only
     * canonical grouping separators are treated as grouping.
     * When "edit", allows alternate decimal separators (such as '.' in comma-decimal locales)
     * during interactive input entry.
     */
    mode?: LocalizedNumberParseMode;
    /**
     * Legacy convenience flag equivalent to `mode: "edit"`.
     */
    alternateDecimal?: boolean;
}

export interface LocalizedNumberValidationResult {
    value: number | null;
    valid: boolean;
    fractionDigits: number;
}

export function parseLocalizedNumber(
    text: string | null | undefined,
    localeId: string,
    options?: ParseLocalizedNumberOptions
): number | null {
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

    // Only one leading sign is permitted
    let sign = "";
    if (cleaned.startsWith("-")) {
        sign = "-";
        cleaned = cleaned.slice(1);
    } else if (cleaned.startsWith("+")) {
        cleaned = cleaned.slice(1);
    }
    if (cleaned.includes("-") || cleaned.includes("+")) {
        return null;
    }

    // Remove all whitespace, non-breaking spaces, and narrow no-break spaces
    cleaned = cleaned.replace(/[\s\u00A0\u202F]/g, "");

    const mode: LocalizedNumberParseMode =
        options?.mode ?? (options?.alternateDecimal ? "edit" : "locale");

    if (mode === "locale") {
        if (symbols.decimal === ",") {
            // Comma is the ONLY decimal separator in comma-decimal locales (de-DE, tr-TR, fr-FR)
            if (cleaned.indexOf(",") !== cleaned.lastIndexOf(",")) {
                return null;
            }
            if (symbols.group === ".") {
                if (cleaned.includes(".")) {
                    const intPart = cleaned.includes(",") ? cleaned.split(",")[0] : cleaned;
                    const dotParts = intPart.split(".");
                    if (dotParts[0].length < 1 || dotParts[0].length > 3 || !/^\d+$/.test(dotParts[0])) {
                        return null;
                    }
                    for (let i = 1; i < dotParts.length; i++) {
                        if (dotParts[i].length !== 3 || !/^\d{3}$/.test(dotParts[i])) {
                            return null;
                        }
                    }
                    // Dot cannot appear after comma
                    if (cleaned.includes(",") && cleaned.indexOf(".") > cleaned.indexOf(",")) {
                        return null;
                    }
                    cleaned = intPart.replace(/\./g, "") + (cleaned.includes(",") ? "," + cleaned.split(",")[1] : "");
                }
            } else {
                if (cleaned.includes(".")) {
                    return null;
                }
                if (symbols.group) {
                    cleaned = cleaned.replaceAll(symbols.group, "");
                }
            }

            if (cleaned.includes(",")) {
                const parts = cleaned.split(",");
                if (parts[1].length === 0) {
                    cleaned = parts[0];
                } else if (!/^\d+$/.test(parts[1])) {
                    return null;
                } else {
                    cleaned = parts[0] + "." + parts[1];
                }
            } else if (!/^\d+$/.test(cleaned)) {
                return null;
            }
        } else if (symbols.decimal === ".") {
            // Dot is the ONLY decimal separator in dot-decimal locales (en-US, etc.)
            if (cleaned.indexOf(".") !== cleaned.lastIndexOf(".")) {
                return null;
            }
            if (symbols.group === ",") {
                if (cleaned.includes(",")) {
                    const intPart = cleaned.includes(".") ? cleaned.split(".")[0] : cleaned;
                    const commaParts = intPart.split(",");
                    if (commaParts[0].length < 1 || commaParts[0].length > 3 || !/^\d+$/.test(commaParts[0])) {
                        return null;
                    }
                    for (let i = 1; i < commaParts.length; i++) {
                        if (commaParts[i].length !== 3 || !/^\d{3}$/.test(commaParts[i])) {
                            return null;
                        }
                    }
                    if (cleaned.includes(".") && cleaned.indexOf(",") > cleaned.indexOf(".")) {
                        return null;
                    }
                    cleaned = intPart.replace(/,/g, "") + (cleaned.includes(".") ? "." + cleaned.split(".")[1] : "");
                }
            } else if (symbols.group) {
                if (cleaned.includes(",")) {
                    return null;
                }
                cleaned = cleaned.replaceAll(symbols.group, "");
            }

            if (cleaned.includes(".")) {
                const parts = cleaned.split(".");
                if (parts[1].length === 0) {
                    cleaned = parts[0];
                } else if (!/^\d+$/.test(parts[1])) {
                    return null;
                }
            } else if (!/^\d+$/.test(cleaned)) {
                return null;
            }
        } else {
            // Locales with other decimal symbols (e.g. Arabic ٫ U+066B, Persian /, etc.)
            cleaned = cleaned.replace(/\u066C/g, "");
            if (symbols.group) {
                cleaned = cleaned.replaceAll(symbols.group, "");
            }
            if (cleaned.includes(",") || (symbols.decimal !== "." && cleaned.includes("."))) {
                return null;
            }
            if (symbols.decimal) {
                if (cleaned.includes(symbols.decimal)) {
                    if (cleaned.indexOf(symbols.decimal) !== cleaned.lastIndexOf(symbols.decimal)) {
                        return null;
                    }
                    cleaned = cleaned.replace(symbols.decimal, ".");
                }
            }
        }
    } else {
        // mode === "edit": permissive interactive editing with alternate decimal separator
        if (symbols.group && symbols.group !== ".") {
            cleaned = cleaned.replaceAll(symbols.group, "");
        }
        cleaned = cleaned.replace(/[\u066C]/g, "");

        if (symbols.decimal === ",") {
            if (cleaned.includes(",")) {
                cleaned = cleaned.replace(/\./g, "").replace(",", ".");
            } else if (cleaned.includes(".")) {
                const dotParts = cleaned.split(".");
                if (dotParts.length === 2) {
                    // Single dot in edit mode is treated as alternate decimal
                    cleaned = dotParts[0] + "." + dotParts[1];
                } else if (dotParts.length > 2) {
                    // Multiple dots => group separators
                    cleaned = cleaned.replace(/\./g, "");
                }
            }
        } else {
            if (symbols.decimal !== ".") {
                cleaned = cleaned.replaceAll(symbols.decimal, ".");
            }
            cleaned = cleaned.replace(/\u066B/g, ".");
            if (cleaned.includes("/")) {
                cleaned = cleaned.replace(/\//g, ".");
            }
            if (cleaned.includes(".")) {
                cleaned = cleaned.replace(/,/g, "");
            } else if (cleaned.includes(",")) {
                const commaParts = cleaned.split(",");
                if (commaParts.length === 2) {
                    cleaned = commaParts[0] + "." + commaParts[1];
                } else {
                    cleaned = cleaned.replace(/,/g, "");
                }
            }
        }
    }

    const fullStr = sign + cleaned;
    const num = Number(fullStr);
    return Number.isFinite(num) ? num : null;
}

export function validateLocalizedNumber(
    text: string | null | undefined,
    localeId: string,
    options?: {
        mode?: LocalizedNumberParseMode;
        decimals?: number;
    }
): LocalizedNumberValidationResult {
    if (text == null) {
        return { value: null, valid: true, fractionDigits: 0 };
    }
    const trimmed = String(text).trim();
    if (trimmed === "" || trimmed === "-" || trimmed === "+") {
        return { value: null, valid: true, fractionDigits: 0 };
    }

    const mode: LocalizedNumberParseMode = options?.mode ?? "locale";
    const parsed = parseLocalizedNumber(trimmed, localeId, { mode });
    if (parsed === null || !Number.isFinite(parsed)) {
        return { value: null, valid: false, fractionDigits: 0 };
    }

    // Determine the number of fraction digits from the source string
    const symbols = getNumberSymbols(localeId);
    let normalized = normalizeLocalizedMinus(trimmed, symbols);
    normalized = normalizeLocalizedDigits(normalized, localeId);
    normalized = normalized.replace(/[\s\u00A0\u202F]/g, "");

    let fractionDigits = 0;
    if (mode === "locale") {
        if (symbols.decimal === ",") {
            if (normalized.includes(",")) {
                const fracPart = normalized.slice(normalized.lastIndexOf(",") + 1).replace(/\D/g, "");
                fractionDigits = fracPart.length;
            }
        } else if (symbols.decimal === ".") {
            if (normalized.includes(".")) {
                const fracPart = normalized.slice(normalized.lastIndexOf(".") + 1).replace(/\D/g, "");
                fractionDigits = fracPart.length;
            }
        } else {
            if (symbols.decimal && normalized.includes(symbols.decimal)) {
                const fracPart = normalized
                    .slice(normalized.lastIndexOf(symbols.decimal) + symbols.decimal.length)
                    .replace(/\D/g, "");
                fractionDigits = fracPart.length;
            } else if (normalized.includes("\u066B")) {
                const fracPart = normalized.slice(normalized.lastIndexOf("\u066B") + 1).replace(/\D/g, "");
                fractionDigits = fracPart.length;
            }
        }
    } else {
        let sep: string | null = null;
        if (symbols.decimal === ",") {
            if (normalized.includes(",")) {
                sep = ",";
            } else if (normalized.includes(".")) {
                const dotParts = normalized.split(".");
                if (dotParts.length === 2) {
                    sep = ".";
                }
            }
        } else {
            if (symbols.decimal && normalized.includes(symbols.decimal)) {
                sep = symbols.decimal;
            } else if (normalized.includes(".")) {
                sep = ".";
            } else if (normalized.includes("\u066B")) {
                sep = "\u066B";
            } else if (normalized.includes("/")) {
                sep = "/";
            } else if (normalized.includes(",")) {
                const commaParts = normalized.split(",");
                if (commaParts.length === 2) {
                    sep = ",";
                }
            }
        }
        if (sep != null) {
            const fracPart = normalized.slice(normalized.lastIndexOf(sep) + sep.length).replace(/\D/g, "");
            fractionDigits = fracPart.length;
        }
    }

    if (options?.decimals !== undefined && fractionDigits > options.decimals) {
        return { value: parsed, valid: false, fractionDigits };
    }

    return { value: parsed, valid: true, fractionDigits };
}

