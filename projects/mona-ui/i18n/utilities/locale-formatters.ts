export interface NumberSymbols {
    readonly decimal: string;
    readonly group: string;
    readonly minus: string;
    readonly digits: ReadonlyMap<string, string>;
}

export interface NumberGroupingPattern {
    readonly primaryGroupSize: number;
    readonly secondaryGroupSize: number;
    readonly groupSeparator: string;
    readonly minimumGroupedIntegerDigits: number;
}

const numberSymbolsCache = new Map<string, NumberSymbols>();
const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const numberGroupingCache = new Map<string, NumberGroupingPattern>();

function serializeOptions(options?: Intl.NumberFormatOptions): string {
    if (!options) {
        return "";
    }
    const keys = Object.keys(options).sort();
    return keys.map(k => `${k}:${String((options as Record<string, unknown>)[k])}`).join(";");
}

export function getNumberGroupingPattern(localeId: string): NumberGroupingPattern {
    let pattern = numberGroupingCache.get(localeId);
    if (!pattern) {
        try {
            const formatter = new Intl.NumberFormat(localeId, {
                useGrouping: true,
                maximumFractionDigits: 0
            });
            const parts = formatter.formatToParts(123456789012345);
            const integerParts = parts.filter(p => p.type === "integer");
            const groupParts = parts.filter(p => p.type === "group");
            const groupSeparator = groupParts[0]?.value ?? getNumberSymbols(localeId).group ?? ",";

            let minimumGroupedIntegerDigits = 4;
            try {
                const defaultFormatter = new Intl.NumberFormat(localeId);
                let probe = 1000;
                let digits = 4;
                while (digits <= 8) {
                    if (defaultFormatter.formatToParts(probe).some(p => p.type === "group")) {
                        minimumGroupedIntegerDigits = digits;
                        break;
                    }
                    probe *= 10;
                    digits++;
                }
            } catch {
                minimumGroupedIntegerDigits = 4;
            }

            if (integerParts.length >= 2) {
                const primaryStr = integerParts[integerParts.length - 1].value.replace(/[\u061C\u200E\u200F\s]/g, "");
                const secondaryStr = integerParts[integerParts.length - 2].value.replace(/[\u061C\u200E\u200F\s]/g, "");
                const primaryGroupSize = Array.from(primaryStr).length;
                const secondaryGroupSize = Array.from(secondaryStr).length;
                pattern = {
                    primaryGroupSize: primaryGroupSize > 0 ? primaryGroupSize : 3,
                    secondaryGroupSize: secondaryGroupSize > 0 ? secondaryGroupSize : 3,
                    groupSeparator,
                    minimumGroupedIntegerDigits
                };
            } else {
                pattern = {
                    primaryGroupSize: 3,
                    secondaryGroupSize: 3,
                    groupSeparator,
                    minimumGroupedIntegerDigits
                };
            }
        } catch {
            const groupSeparator = getNumberSymbols(localeId).group ?? ",";
            pattern = {
                primaryGroupSize: 3,
                secondaryGroupSize: 3,
                groupSeparator,
                minimumGroupedIntegerDigits: 4
            };
        }
        numberGroupingCache.set(localeId, pattern);
    }
    return pattern;
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
            digitMap.set(String.fromCharCode(0x0966 + i), String(i)); // Devanagari
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
            } else if (code >= 0x0966 && code <= 0x096f) {
                result += String(code - 0x0966);
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

    const mode: LocalizedNumberParseMode =
        options?.mode ?? (options?.alternateDecimal ? "edit" : "locale");

    if (mode === "locale") {
        const grouping = getNumberGroupingPattern(localeId);
        const groupSep = grouping.groupSeparator;
        const isSpaceGroup = /[ \u00A0\u202F]/.test(groupSep);
        const decimalSep = symbols.decimal;

        // Reject non-accepted control or whitespace characters (tabs, newlines, formfeeds)
        if (/[^\S\u0020\u00A0\u202F]/.test(cleaned)) {
            return null;
        }

        // In strict locale mode, if grouping separator is not space-like, any internal whitespace is invalid
        if (!isSpaceGroup && /[\s\u00A0\u202F]/.test(cleaned)) {
            return null;
        }

        // Split integer and fraction by canonical decimal separator
        let intPart: string;
        let fracPart: string | null = null;

        if (decimalSep && cleaned.includes(decimalSep)) {
            if (cleaned.indexOf(decimalSep) !== cleaned.lastIndexOf(decimalSep)) {
                return null;
            }
            const decimalIdx = cleaned.indexOf(decimalSep);
            intPart = cleaned.slice(0, decimalIdx);
            fracPart = cleaned.slice(decimalIdx + decimalSep.length);
        } else {
            // If the string contains an unexpected decimal-like character that is not the group separator, reject
            if (decimalSep === "," && groupSep !== "." && cleaned.includes(".")) {
                return null;
            }
            if (decimalSep === "." && groupSep !== "," && cleaned.includes(",")) {
                return null;
            }
            intPart = cleaned;
        }

        // Fractional part validation
        if (fracPart !== null) {
            // Group separators or whitespace are never permitted in the fractional part
            if (groupSep && fracPart.includes(groupSep)) {
                return null;
            }
            if (/[\s\u00A0\u202F]/.test(fracPart)) {
                return null;
            }
            if (fracPart.length > 0 && !/^\d+$/.test(fracPart)) {
                return null;
            }
        }

        // Integer part validation
        if (intPart.length === 0) {
            if (fracPart === null || fracPart.length === 0) {
                return null;
            }
            intPart = "0";
        } else {
            let intGroups: string[];
            let hasGroup = false;

            if (isSpaceGroup) {
                if (/[ \u00A0\u202F]/.test(intPart)) {
                    hasGroup = true;
                    // Splitting by single accepted space character preserves empty strings for consecutive spaces
                    intGroups = intPart.split(/[ \u00A0\u202F]/);
                } else {
                    intGroups = [intPart];
                }
            } else {
                if (groupSep && intPart.includes(groupSep)) {
                    hasGroup = true;
                    intGroups = intPart.split(groupSep);
                } else {
                    intGroups = [intPart];
                }
            }

            if (hasGroup) {
                if (intGroups.length < 2) {
                    return null;
                }

                // Canonical strict check: must meet locale's minimum grouping threshold
                const totalGroupedDigits = intGroups.join("").length;
                if (totalGroupedDigits < grouping.minimumGroupedIntegerDigits) {
                    return null;
                }

                // Last (rightmost) group: must match primaryGroupSize digits
                const lastGroup = intGroups[intGroups.length - 1];
                if (lastGroup.length !== grouping.primaryGroupSize || !/^\d+$/.test(lastGroup)) {
                    return null;
                }

                // Intermediate groups: must match secondaryGroupSize digits
                for (let i = 1; i < intGroups.length - 1; i++) {
                    const midGroup = intGroups[i];
                    if (midGroup.length !== grouping.secondaryGroupSize || !/^\d+$/.test(midGroup)) {
                        return null;
                    }
                }

                // First group: must have 1..secondaryGroupSize digits
                const firstGroup = intGroups[0];
                if (
                    firstGroup.length < 1 ||
                    firstGroup.length > grouping.secondaryGroupSize ||
                    !/^\d+$/.test(firstGroup)
                ) {
                    return null;
                }

                intPart = intGroups.join("");
            } else {
                // Ungrouped integer must consist solely of digits
                if (!/^\d+$/.test(intPart)) {
                    return null;
                }
            }
        }

        const normalizedStr = sign + intPart + (fracPart && fracPart.length > 0 ? "." + fracPart : "");
        const num = Number(normalizedStr);
        return Number.isFinite(num) ? num : null;
    } else {
        // mode === "edit": permissive interactive editing with alternate decimal separator
        cleaned = cleaned.replace(/[ \u00A0\u202F]/g, "");

        // Strip non-dot/non-comma locale group separators (e.g. Arabic \u066C)
        if (symbols.group && symbols.group !== "." && symbols.group !== ",") {
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
                } else if (commaParts.length > 2) {
                    cleaned = cleaned.replace(/,/g, "");
                }
            }
        }

        const fullStr = sign + cleaned;
        const num = Number(fullStr);
        return Number.isFinite(num) ? num : null;
    }
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
    normalized = normalized.replace(/[ \u00A0\u202F]/g, "");

    let fractionDigits = 0;
    if (mode === "locale") {
        if (symbols.decimal && normalized.includes(symbols.decimal)) {
            const fracPart = normalized
                .slice(normalized.lastIndexOf(symbols.decimal) + symbols.decimal.length)
                .replace(/\D/g, "");
            fractionDigits = fracPart.length;
        } else if (normalized.includes("\u066B")) {
            const fracPart = normalized.slice(normalized.lastIndexOf("\u066B") + 1).replace(/\D/g, "");
            fractionDigits = fracPart.length;
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
            if (symbols.decimal && symbols.decimal !== "." && symbols.decimal !== "," && normalized.includes(symbols.decimal)) {
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

export interface LocalizedNumberEditValidationResult {
    readonly valid: boolean;
    readonly complete: boolean;
    readonly value: number | null;
}

export interface ValidateLocalizedNumberEditOptions {
    readonly decimals?: number;
    readonly allowSign?: boolean;
}

export function validateLocalizedNumberEdit(
    text: string | null | undefined,
    localeId: string,
    options?: ValidateLocalizedNumberEditOptions
): LocalizedNumberEditValidationResult {
    if (text == null) {
        return { valid: true, complete: false, value: null };
    }
    const raw = String(text);
    if (raw === "") {
        return { valid: true, complete: false, value: null };
    }

    // Reject control or whitespace characters in interactive typing
    if (/[\s\u00A0\u202F]/.test(raw)) {
        return { valid: false, complete: false, value: null };
    }

    const symbols = getNumberSymbols(localeId);

    // Normalize minus signs and bidi controls
    let normalized = normalizeLocalizedMinus(raw, symbols);
    // Normalize localized digits to ASCII
    normalized = normalizeLocalizedDigits(normalized, localeId);

    // Sign handling
    const allowSign = options?.allowSign ?? true;
    if (normalized.startsWith("-") || normalized.startsWith("+")) {
        if (!allowSign) {
            return { valid: false, complete: false, value: null };
        }
        normalized = normalized.slice(1);
    }
    if (normalized.includes("-") || normalized.includes("+")) {
        return { valid: false, complete: false, value: null };
    }

    // If input was just "-" or "+"
    if (normalized === "") {
        return { valid: true, complete: false, value: null };
    }

    // Identify allowed decimal separators
    const primaryDec = symbols.decimal || ".";
    // Candidate separators: primary decimal, plus alternate '.' or ','
    const candidateSeparators = new Set<string>();
    candidateSeparators.add(primaryDec);
    if (primaryDec === ".") {
        candidateSeparators.add(",");
    } else if (primaryDec === ",") {
        candidateSeparators.add(".");
    } else {
        candidateSeparators.add(".");
        candidateSeparators.add(",");
    }
    if (primaryDec === "\u066B") {
        candidateSeparators.add(".");
        candidateSeparators.add(",");
    }

    // Count how many separators from the candidate set appear
    let foundSep: string | null = null;
    let sepIndex = -1;

    for (let i = 0; i < normalized.length; i++) {
        for (const sep of candidateSeparators) {
            if (normalized.startsWith(sep, i)) {
                if (foundSep !== null) {
                    // More than one separator is rejected in edit mode
                    return { valid: false, complete: false, value: null };
                }
                foundSep = sep;
                sepIndex = i;
                i += sep.length - 1;
                break;
            }
        }
    }

    const decimals = options?.decimals ?? 0;

    if (foundSep !== null) {
        if (decimals === 0) {
            // No decimal point permitted when decimals === 0
            return { valid: false, complete: false, value: null };
        }

        const intPart = normalized.slice(0, sepIndex);
        const fracPart = normalized.slice(sepIndex + foundSep.length);

        // Integer part before separator must consist purely of ASCII digits (or empty, e.g. ".5")
        if (intPart.length > 0 && !/^\d+$/.test(intPart)) {
            return { valid: false, complete: false, value: null };
        }

        // Fractional part after separator must consist purely of ASCII digits (or empty, e.g. "12.")
        if (fracPart.length > 0 && !/^\d+$/.test(fracPart)) {
            return { valid: false, complete: false, value: null };
        }

        // Count fraction digits using normalized ASCII characters (safe against UTF-16 astral splitting)
        if (fracPart.length > decimals) {
            return { valid: false, complete: false, value: null };
        }

        const parsed = parseLocalizedNumber(raw, localeId, { mode: "edit" });
        const complete = fracPart.length > 0 && (intPart.length > 0 || fracPart.length > 0);

        return {
            valid: true,
            complete,
            value: parsed
        };
    }

    // No separator found: must be purely ASCII digits
    if (!/^\d+$/.test(normalized)) {
        return { valid: false, complete: false, value: null };
    }

    const parsed = parseLocalizedNumber(raw, localeId, { mode: "edit" });
    return {
        valid: true,
        complete: true,
        value: parsed
    };
}
