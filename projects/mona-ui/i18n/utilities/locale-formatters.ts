import { canonicalizeLocaleId } from "./locale-id";

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
    /**
     * Fewest integer digits the locale groups when formatting (5 in es-ES, which formats 1000 but 10.000).
     * Parsing does not enforce it: "1.000" is still read as 1000 in es-ES.
     */
    readonly minimumGroupedIntegerDigits: number;
}

/** Full-width forms of printable ASCII ("！" to "～"), offset from ASCII by U+FEE0. */
const FULLWIDTH_ASCII_START = 0xff01;
const FULLWIDTH_ASCII_END = 0xff5e;
const FULLWIDTH_ASCII_OFFSET = 0xfee0;
const DECIMAL_DIGIT_REGEX = /^\p{Nd}$/u;
/** Apostrophe, right single quotation mark and modifier letter apostrophe. */
const APOSTROPHE_REGEX = /^['\u2019\u02BC]$/;
const APOSTROPHE_REGEX_GLOBAL = /['\u2019\u02BC]/g;

const asciiDigitCache = new Map<string, string | null>();
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

export function getNumberGroupingPattern(locale: string): NumberGroupingPattern {
    const localeId = canonicalizeLocaleId(locale);
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

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export function getNumberSymbols(locale: string): NumberSymbols {
    const localeId = canonicalizeLocaleId(locale);
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

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export function getNumberFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
    const cleanLocale = canonicalizeLocaleId(locale);
    const key = `${cleanLocale}:${serializeOptions(options)}`;
    let formatter = numberFormatterCache.get(key);
    if (!formatter) {
        try {
            formatter = new Intl.NumberFormat(cleanLocale, options);
        } catch {
            formatter = new Intl.NumberFormat("en-US", options);
        }
        numberFormatterCache.set(key, formatter);
    }
    return formatter;
}

/**
 * Formats a number for the locale. A decimal string, such as one returned by {@link parseLocalizedDecimal}, is
 * formatted exactly, without converting it to a `number` first.
 */
export function formatNumber(value: number | string, locale: string, options?: Intl.NumberFormatOptions): string {
    // Intl.NumberFormat formats decimal strings exactly (Intl.NumberFormat v3); the ES2022 lib types only declare numbers.
    return getNumberFormatter(locale, options).format(value as number);
}

/**
 * ASCII value of a Unicode decimal digit (\p{Nd}), or null for any other character. Unicode encodes every
 * decimal digit set as a contiguous 0-9 run, so the value is the distance from the start of the run.
 */
function toAsciiDigit(char: string): string | null {
    let digit = asciiDigitCache.get(char);
    if (digit === undefined) {
        digit = null;
        if (DECIMAL_DIGIT_REGEX.test(char)) {
            const code = char.codePointAt(0)!;
            let runStart = code;
            while (DECIMAL_DIGIT_REGEX.test(String.fromCodePoint(runStart - 1))) {
                runStart--;
            }
            digit = String((code - runStart) % 10);
        }
        asciiDigitCache.set(char, digit);
    }
    return digit;
}

/**
 * Converts digits of any script to ASCII digits. Full-width forms typed by CJK input methods
 * ("１２．５", "－３", "１，０００") are folded to ASCII first.
 */
export function normalizeLocalizedDigits(text: string, localeId?: string): string {
    if (!text) {
        return text;
    }
    const symbols = localeId ? getNumberSymbols(localeId) : null;
    let result = "";
    for (const char of text) {
        const code = char.codePointAt(0)!;
        const folded =
            code >= FULLWIDTH_ASCII_START && code <= FULLWIDTH_ASCII_END
                ? String.fromCharCode(code - FULLWIDTH_ASCII_OFFSET)
                : char;
        result += symbols?.digits.get(folded) ?? toAsciiDigit(folded) ?? folded;
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

/**
 * Decimal separators accepted while editing: the locale's own, plus "." and "," so a separator typed on a
 * keyboard layout that does not match the locale still works. An alternate is dropped when it is the locale's
 * group separator; otherwise "1,234" typed in en-US (or "1.234" in de-DE) would be read as 1.234.
 */
export function getEditDecimalSeparators(symbols: NumberSymbols): ReadonlySet<string> {
    const primary = symbols.decimal || ".";
    const separators = new Set<string>([primary]);
    for (const alternate of [".", ","]) {
        if (alternate !== symbols.group) {
            separators.add(alternate);
        }
    }
    return separators;
}

export type LocalizedNumberParseMode = "edit" | "locale";

export interface ParseLocalizedNumberOptions {
    /**
     * When "locale" (default), parses strictly according to canonical locale rules.
     * Only the locale's canonical decimal separator is treated as decimal, and only
     * canonical grouping separators are treated as grouping.
     * When "edit", allows alternate decimal separators (such as '.' in comma-decimal locales)
     * during interactive input entry, unless the alternate is the locale's group separator.
     */
    mode?: LocalizedNumberParseMode;
    /**
     * Legacy convenience flag equivalent to `mode: "edit"`.
     */
    alternateDecimal?: boolean;
}

/**
 * Why a value was refused:
 * - `"syntax"`: the text is not a number in the locale.
 * - `"decimals"`: it has more fraction digits than allowed.
 * - `"precision"`: a JavaScript `number` cannot hold it exactly (an integer beyond
 *   `Number.MAX_SAFE_INTEGER`, or more than 15 significant digits), so accepting it would silently change it.
 */
export type LocalizedNumberInvalidReason = "decimals" | "precision" | "syntax";

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export interface LocalizedNumberValidationResult {
    fractionDigits: number;
    /** Set when `valid` is false. */
    reason?: LocalizedNumberInvalidReason;
    valid: boolean;
    value: number | null;
}

const MAX_SAFE_INTEGER_DIGITS = String(Number.MAX_SAFE_INTEGER);

/** The most significant digits a double reproduces exactly when converted from decimal text and back. */
const MAX_EXACT_SIGNIFICANT_DIGITS = 15;

/** Whether ASCII integer and fraction digits survive conversion to a `number` unchanged. */
function isRepresentableAsNumber(intDigits: string, fracDigits: string): boolean {
    const integer = intDigits.replace(/^0+/, "");
    const fraction = fracDigits.replace(/0+$/, "");
    if (fraction === "") {
        return (
            integer.length < MAX_SAFE_INTEGER_DIGITS.length ||
            (integer.length === MAX_SAFE_INTEGER_DIGITS.length && integer <= MAX_SAFE_INTEGER_DIGITS)
        );
    }
    return (integer + fraction).replace(/^0+/, "").length <= MAX_EXACT_SIGNIFICANT_DIGITS;
}

/** A parsed number as ASCII digits, before it is converted to a `number` or a decimal string. */
interface LocalizedNumberParts {
    readonly fraction: string;
    readonly integer: string;
    readonly negative: boolean;
}

function partsToNumber(parts: LocalizedNumberParts): number | "precision" {
    if (!isRepresentableAsNumber(parts.integer, parts.fraction)) {
        return "precision";
    }
    return Number((parts.negative ? "-" : "") + parts.integer + (parts.fraction ? "." + parts.fraction : ""));
}

/** Leading zeros, trailing fraction zeros and the sign of zero are dropped: `"-0012.500"` becomes `"-12.5"`. */
function partsToDecimal(parts: LocalizedNumberParts): string {
    const integer = parts.integer.replace(/^0+(?=\d)/, "") || "0";
    const fraction = parts.fraction.replace(/0+$/, "");
    const digits = fraction ? `${integer}.${fraction}` : integer;
    return parts.negative && /[1-9]/.test(digits) ? `-${digits}` : digits;
}

/**
 * Parses localized text to a number. Returns `null` when the text is not a number in the locale, or when a
 * `number` cannot hold it exactly (see {@link LocalizedNumberInvalidReason}); it never rounds silently.
 * Use {@link parseLocalizedDecimal} for values that need more precision.
 */
export function parseLocalizedNumber(
    text: string | null | undefined,
    localeId: string,
    options?: ParseLocalizedNumberOptions
): number | null {
    const parts = parseLocalizedNumberParts(text, localeId, options);
    const value = parts === null ? null : partsToNumber(parts);
    return value === "precision" ? null : value;
}

/**
 * Parses localized text with the same rules as {@link parseLocalizedNumber}, but returns a canonical decimal string
 * (`"-1234.5"`: ASCII digits, `.` as the decimal separator, no grouping, exponent, leading zeros or trailing
 * fraction zeros) and has no precision limit. Returns `null` when the text is not a number in the locale.
 */
export function parseLocalizedDecimal(
    text: string | null | undefined,
    localeId: string,
    options?: ParseLocalizedNumberOptions
): string | null {
    const parts = parseLocalizedNumberParts(text, localeId, options);
    return parts === null ? null : partsToDecimal(parts);
}

function parseLocalizedNumberParts(
    text: string | null | undefined,
    localeId: string,
    options?: ParseLocalizedNumberOptions
): LocalizedNumberParts | null {
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

        // Engines disagree on the apostrophe a locale groups with (de-CH: Node ICU "'", Chrome "’"),
        // and keyboards type "'", so every apostrophe variant counts as that locale's group separator.
        if (APOSTROPHE_REGEX.test(groupSep)) {
            cleaned = cleaned.replace(APOSTROPHE_REGEX_GLOBAL, groupSep);
        }

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

                // Grouping below the locale's minimum (es-ES formats 1000, not 1.000) is still accepted:
                // users type and paste it, and it is unambiguous because the group sizes are checked below.

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

        return { fraction: fracPart ?? "", integer: intPart, negative: sign === "-" };
    } else {
        // mode === "edit": editor buffer grammar with exactly one decimal separator (locale primary or alternate)
        // No group separators or internal whitespace permitted in editor buffer
        if (/[\s\u00A0\u202F]/.test(cleaned)) {
            return null;
        }

        const candidateSeparators = getEditDecimalSeparators(symbols);

        let foundSep: string | null = null;
        let sepIndex = -1;

        for (let i = 0; i < cleaned.length; i++) {
            for (const sep of candidateSeparators) {
                if (cleaned.startsWith(sep, i)) {
                    if (foundSep !== null) {
                        // More than one separator (or repeated alternate separators) is rejected
                        return null;
                    }
                    foundSep = sep;
                    sepIndex = i;
                    i += sep.length - 1;
                    break;
                }
            }
        }

        // Reject if any non-candidate dot or comma remains
        if (cleaned.includes(".") && !candidateSeparators.has(".")) {
            return null;
        }
        if (cleaned.includes(",") && !candidateSeparators.has(",")) {
            return null;
        }

        let intPart: string;
        let fracPart: string;

        if (foundSep !== null) {
            intPart = cleaned.slice(0, sepIndex);
            fracPart = cleaned.slice(sepIndex + foundSep.length);

            if (intPart.length > 0 && !/^\d+$/.test(intPart)) {
                return null;
            }
            if (fracPart.length > 0 && !/^\d+$/.test(fracPart)) {
                return null;
            }
            if (intPart.length === 0 && fracPart.length === 0) {
                return null;
            }
        } else {
            if (!/^\d+$/.test(cleaned)) {
                return null;
            }
            intPart = cleaned;
            fracPart = "";
        }

        return { fraction: fracPart, integer: intPart.length > 0 ? intPart : "0", negative: sign === "-" };
    }
}

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
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
    const parts = parseLocalizedNumberParts(trimmed, localeId, { mode });
    const parsed = parts === null ? null : partsToNumber(parts);
    if (parsed === "precision") {
        return { value: null, valid: false, fractionDigits: 0, reason: "precision" };
    }
    if (parsed === null || !Number.isFinite(parsed)) {
        return { value: null, valid: false, fractionDigits: 0, reason: "syntax" };
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
        return { value: parsed, valid: false, fractionDigits, reason: "decimals" };
    }

    return { value: parsed, valid: true, fractionDigits };
}

export interface LocalizedDecimalValidationResult {
    fractionDigits: number;
    /** Set when `valid` is false. */
    reason?: LocalizedNumberInvalidReason;
    valid: boolean;
    /** A canonical decimal string, see {@link parseLocalizedDecimal}. */
    value: string | null;
}

/**
 * Validates localized text like {@link validateLocalizedNumber}, but returns a canonical decimal string and has no
 * precision limit, so `reason` is never `"precision"`.
 */
export function validateLocalizedDecimal(
    text: string | null | undefined,
    localeId: string,
    options?: {
        mode?: LocalizedNumberParseMode;
        decimals?: number;
    }
): LocalizedDecimalValidationResult {
    const trimmed = text == null ? "" : String(text).trim();
    if (trimmed === "" || trimmed === "-" || trimmed === "+") {
        return { fractionDigits: 0, valid: true, value: null };
    }
    const parts = parseLocalizedNumberParts(trimmed, localeId, { mode: options?.mode ?? "locale" });
    if (parts === null) {
        return { fractionDigits: 0, reason: "syntax", valid: false, value: null };
    }
    const value = partsToDecimal(parts);
    const fractionDigits = parts.fraction.length;
    if (options?.decimals !== undefined && fractionDigits > options.decimals) {
        return { fractionDigits, reason: "decimals", valid: false, value };
    }
    return { fractionDigits, valid: true, value };
}

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export interface LocalizedNumberEditValidationResult {
    readonly complete: boolean;
    /** Set when `valid` is false. */
    readonly reason?: LocalizedNumberInvalidReason;
    readonly valid: boolean;
    readonly value: number | null;
}

export interface LocalizedDecimalEditValidationResult {
    readonly complete: boolean;
    /** Set when `valid` is false. */
    readonly reason?: LocalizedNumberInvalidReason;
    readonly valid: boolean;
    /** A canonical decimal string, see {@link parseLocalizedDecimal}. */
    readonly value: string | null;
}

interface EditValidationResult<T> {
    readonly complete: boolean;
    readonly reason?: LocalizedNumberInvalidReason;
    readonly valid: boolean;
    readonly value: T | null;
}

const EDIT_SYNTAX_ERROR = { complete: false, reason: "syntax", valid: false, value: null } as const;

export interface ValidateLocalizedNumberEditOptions {
    readonly decimals?: number;
    readonly allowSign?: boolean;
}

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export function validateLocalizedNumberEdit(
    text: string | null | undefined,
    localeId: string,
    options?: ValidateLocalizedNumberEditOptions
): LocalizedNumberEditValidationResult {
    return validateEditInput(text, localeId, options, partsToNumber);
}

/**
 * Validates text while it is typed, like {@link validateLocalizedNumberEdit}, but returns a canonical decimal string
 * and has no precision limit.
 */
export function validateLocalizedDecimalEdit(
    text: string | null | undefined,
    localeId: string,
    options?: ValidateLocalizedNumberEditOptions
): LocalizedDecimalEditValidationResult {
    return validateEditInput(text, localeId, options, partsToDecimal);
}

function validateEditInput<T>(
    text: string | null | undefined,
    localeId: string,
    options: ValidateLocalizedNumberEditOptions | undefined,
    convert: (parts: LocalizedNumberParts) => T | "precision"
): EditValidationResult<T> {
    if (text == null) {
        return { valid: true, complete: false, value: null };
    }
    const raw = String(text);
    if (raw === "") {
        return { valid: true, complete: false, value: null };
    }

    // Reject control or whitespace characters in interactive typing
    if (/[\s\u00A0\u202F]/.test(raw)) {
        return EDIT_SYNTAX_ERROR;
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
            return EDIT_SYNTAX_ERROR;
        }
        normalized = normalized.slice(1);
    }
    if (normalized.includes("-") || normalized.includes("+")) {
        return EDIT_SYNTAX_ERROR;
    }

    // If input was just "-" or "+"
    if (normalized === "") {
        return { valid: true, complete: false, value: null };
    }

    const candidateSeparators = getEditDecimalSeparators(symbols);

    // Count how many separators from the candidate set appear
    let foundSep: string | null = null;
    let sepIndex = -1;

    for (let i = 0; i < normalized.length; i++) {
        for (const sep of candidateSeparators) {
            if (normalized.startsWith(sep, i)) {
                if (foundSep !== null) {
                    // More than one separator is rejected in edit mode
                    return EDIT_SYNTAX_ERROR;
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
            return { valid: false, complete: false, value: null, reason: "decimals" };
        }

        const intPart = normalized.slice(0, sepIndex);
        const fracPart = normalized.slice(sepIndex + foundSep.length);

        // Integer part before separator must consist purely of ASCII digits (or empty, e.g. ".5")
        if (intPart.length > 0 && !/^\d+$/.test(intPart)) {
            return EDIT_SYNTAX_ERROR;
        }

        // Fractional part after separator must consist purely of ASCII digits (or empty, e.g. "12.")
        if (fracPart.length > 0 && !/^\d+$/.test(fracPart)) {
            return EDIT_SYNTAX_ERROR;
        }

        // Count fraction digits using normalized ASCII characters (safe against UTF-16 astral splitting)
        if (fracPart.length > decimals) {
            return { valid: false, complete: false, value: null, reason: "decimals" };
        }

        const parts = parseLocalizedNumberParts(raw, localeId, { mode: "edit" });
        const parsed = parts === null ? null : convert(parts);
        // Refuse the keystroke that would make the value too precise for the target type, instead of rounding it.
        if (parsed === "precision") {
            return { valid: false, complete: false, value: null, reason: "precision" };
        }
        const complete = fracPart.length > 0 && (intPart.length > 0 || fracPart.length > 0);

        return {
            valid: true,
            complete,
            value: parsed
        };
    }

    // No separator found: must be purely ASCII digits
    if (!/^\d+$/.test(normalized)) {
        return EDIT_SYNTAX_ERROR;
    }

    const parts = parseLocalizedNumberParts(raw, localeId, { mode: "edit" });
    const parsed = parts === null ? null : convert(parts);
    if (parsed === "precision") {
        return { valid: false, complete: false, value: null, reason: "precision" };
    }
    return {
        valid: true,
        complete: true,
        value: parsed
    };
}
