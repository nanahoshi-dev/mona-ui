import type { DeepPartial } from "../models/deep-partial";
import type { MonaTextDirection } from "../models/mona-direction";
import type { MonaLocale } from "../models/mona-locale";
import type { MonaLocaleMessages } from "../models/mona-locale-messages";

export interface PseudoLocalizationOptions {
    readonly prefix?: string;
    readonly suffix?: string;
    readonly expand?: boolean;
    readonly expansionFactor?: number;
}

export interface GeneratePseudoLocaleOptions {
    readonly id?: string;
    readonly direction?: MonaTextDirection;
    readonly pseudoOptions?: PseudoLocalizationOptions;
}

const PSEUDO_MAP: Readonly<Record<string, string>> = {
    a: "å",
    b: "ƀ",
    c: "ç",
    d: "đ",
    e: "é",
    f: "ƒ",
    g: "ĝ",
    h: "ĥ",
    i: "î",
    j: "ĵ",
    k: "ķ",
    l: "ļ",
    m: "m",
    n: "ñ",
    o: "ö",
    p: "þ",
    q: "q",
    r: "ř",
    s: "š",
    t: "ţ",
    u: "û",
    v: "ṽ",
    w: "ŵ",
    x: "x",
    y: "ŷ",
    z: "ž",
    A: "Å",
    B: "Ɓ",
    C: "Ç",
    D: "Đ",
    E: "É",
    F: "Ƒ",
    G: "Ĝ",
    H: "Ĥ",
    I: "Î",
    J: "Ĵ",
    K: "Ķ",
    L: "Ļ",
    M: "M",
    N: "Ñ",
    O: "Ö",
    P: "Þ",
    Q: "Q",
    R: "Ř",
    S: "Š",
    T: "Ţ",
    U: "Û",
    V: "Ṽ",
    W: "Ŵ",
    X: "X",
    Y: "Ŷ",
    Z: "Ž"
};

/**
 * Transforms a text string into pseudo-localized text (e.g. "Apply" -> "[!! Åþþļÿ~~ !!]").
 * Tokens enclosed in single braces {placeholder}, double braces {{placeholder}}, or HTML tags <tag>
 * are preserved verbatim so formatting / parameter substitution continues to function.
 */
export function pseudoLocalize(text: string, options: PseudoLocalizationOptions = {}): string {
    if (!text || typeof text !== "string") {
        return text;
    }

    const { prefix = "[!! ", suffix = " !!]", expand = true, expansionFactor = 0.3 } = options;

    if (text.startsWith(prefix) && text.endsWith(suffix)) {
        return text;
    }

    // Preserve tokens like {0}, {name}, {{val}}, <span ...>, </b>
    const tokens = text.split(/(\{[^{}]+\}|\{\{[^{}]+\}|<[^>]+>)/g);
    const convertedTokens = tokens.map((segment, index) => {
        // Odd indices match the split token regex
        if (index % 2 === 1) {
            return segment;
        }
        return segment
            .split("")
            .map(char => PSEUDO_MAP[char] ?? char)
            .join("");
    });

    let transformed = convertedTokens.join("");
    if (expand) {
        const expansionLen = Math.max(1, Math.round(text.length * expansionFactor));
        transformed += "~".repeat(expansionLen);
    }

    return `${prefix}${transformed}${suffix}`;
}

/**
 * Recursively pseudo-localizes a message catalog or nested object of message catalogs.
 * Plain strings are pseudo-localized, and message functions (e.g. (page: number) => string)
 * are wrapped so their string outputs are pseudo-localized when invoked.
 */
export function pseudoLocalizeCatalog<T extends object>(catalog: T, options?: PseudoLocalizationOptions): T {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(catalog)) {
        if (typeof value === "string") {
            result[key] = pseudoLocalize(value, options);
        } else if (typeof value === "function") {
            result[key] = (...args: unknown[]) => {
                const out = (value as (...a: unknown[]) => unknown)(...args);
                return typeof out === "string" ? pseudoLocalize(out, options) : out;
            };
        } else if (value && typeof value === "object" && !Array.isArray(value)) {
            result[key] = pseudoLocalizeCatalog(value as object, options);
        } else {
            result[key] = value;
        }
    }

    return result as T;
}

/**
 * Generates a full pseudo-localized MonaLocale (e.g. en-XA) from a dictionary of message catalogs.
 */
export function generatePseudoLocale(
    catalogs: DeepPartial<MonaLocaleMessages>,
    options?: GeneratePseudoLocaleOptions
): MonaLocale {
    const id = options?.id ?? "en-XA";
    const direction = options?.direction ?? "ltr";
    const pseudoOptions = options?.pseudoOptions;
    const messages: Record<string, unknown> = {};

    for (const [namespace, catalog] of Object.entries(catalogs)) {
        if (catalog && typeof catalog === "object") {
            messages[namespace] = pseudoLocalizeCatalog(catalog as object, pseudoOptions);
        }
    }

    return {
        direction,
        id,
        messages: messages as DeepPartial<MonaLocaleMessages>
    };
}
