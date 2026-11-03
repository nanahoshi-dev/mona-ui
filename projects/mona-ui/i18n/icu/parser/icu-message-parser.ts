/**
 * Parser for the subset of ICU MessageFormat that Mona supports:
 *
 * - `{name}` and `{name, number}`, with the `integer` and `percent` styles and the `::group-off`,
 *   `::percent` and `::precision-integer` skeletons
 * - `{name, plural, ...}` and `{name, selectordinal, ...}`, with `=N` and CLDR category selectors, `offset:N`, and `#`
 * - `{name, select, ...}`
 * - apostrophe quoting: `''` is an apostrophe, and `'{'`, `'}'` and, inside a plural, `'#'` are literal
 *
 * Dates, times and other argument types are rejected, because no Mona message takes one.
 */

export type IcuElement =
    IcuArgumentElement | IcuLiteralElement | IcuNumberElement | IcuPluralElement | IcuPoundElement | IcuSelectElement;

export interface IcuArgumentElement {
    readonly kind: "argument";
    readonly name: string;
}

export interface IcuLiteralElement {
    readonly kind: "literal";
    readonly value: string;
}

export interface IcuNumberElement {
    readonly kind: "number";
    readonly name: string;
    readonly options?: Intl.NumberFormatOptions;
}

export interface IcuPluralElement {
    readonly kind: "plural";
    readonly name: string;
    readonly offset: number;
    /** Sub-messages by selector: `=N` for an exact value, or a CLDR plural category. */
    readonly options: ReadonlyMap<string, readonly IcuElement[]>;
    readonly ordinal: boolean;
}

/** `#` inside a plural: the plural's value minus its offset. */
export interface IcuPoundElement {
    readonly kind: "pound";
}

export interface IcuSelectElement {
    readonly kind: "select";
    readonly name: string;
    readonly options: ReadonlyMap<string, readonly IcuElement[]>;
}

export type IcuSyntaxErrorKind = "missing-other" | "syntax";

export class IcuSyntaxError extends Error {
    public readonly kind: IcuSyntaxErrorKind;
    public readonly offset: number;

    public constructor(message: string, offset: number, kind: IcuSyntaxErrorKind = "syntax") {
        super(`${message} at position ${offset}`);
        this.name = "IcuSyntaxError";
        this.kind = kind;
        this.offset = offset;
    }
}

/** Arguments can nest this deep; deeper input is rejected rather than risking a stack overflow. */
const MAX_DEPTH = 16;
const PLURAL_CATEGORIES: ReadonlySet<string> = new Set(["few", "many", "one", "other", "two", "zero"]);
const IDENTIFIER_REGEX = /[A-Za-z_][A-Za-z0-9_]*/y;
const KEYWORD_REGEX = /[\p{L}\p{N}_-]+/uy;
const EXACT_SELECTOR_REGEX = /=-?\d+(?:\.\d+)?/y;
const OFFSET_REGEX = /offset:\s*(\d+)/y;
const WHITESPACE_REGEX = /\s*/y;
const NUMBER_SKELETON_OPTIONS: Readonly<Record<string, Intl.NumberFormatOptions>> = {
    "group-off": { useGrouping: false },
    percent: { style: "percent" },
    "precision-integer": { maximumFractionDigits: 0 }
};

interface ParserState {
    pos: number;
    readonly source: string;
}

/** Parses an ICU message. Throws an {@link IcuSyntaxError} for input outside the supported subset. */
export function parseIcuMessage(source: string): readonly IcuElement[] {
    const state: ParserState = { pos: 0, source };
    return parseMessage(state, 0, false, false);
}

function expect(state: ParserState, char: string): void {
    if (state.source[state.pos] !== char) {
        throw new IcuSyntaxError(
            state.pos >= state.source.length ? `Expected "${char}" but the message ended` : `Expected "${char}"`,
            state.pos
        );
    }
    state.pos++;
}

function match(state: ParserState, regex: RegExp): RegExpExecArray | null {
    regex.lastIndex = state.pos;
    const result = regex.exec(state.source);
    if (result != null) {
        state.pos = regex.lastIndex;
    }
    return result;
}

function parseArgument(state: ParserState, depth: number, inPlural: boolean): IcuElement {
    const start = state.pos;
    if (depth > MAX_DEPTH) {
        throw new IcuSyntaxError(`Arguments are nested more than ${MAX_DEPTH} levels deep`, start);
    }
    expect(state, "{");
    skipWhitespace(state);
    const name = match(state, IDENTIFIER_REGEX)?.[0];
    if (name == null) {
        throw new IcuSyntaxError("Expected an argument name", state.pos);
    }
    skipWhitespace(state);
    if (state.source[state.pos] === "}") {
        state.pos++;
        return { kind: "argument", name };
    }
    expect(state, ",");
    skipWhitespace(state);
    const typeStart = state.pos;
    const type = match(state, IDENTIFIER_REGEX)?.[0];
    skipWhitespace(state);
    switch (type) {
        case "number":
            return parseNumberArgument(state, name);
        case "plural":
        case "selectordinal":
            return parsePluralArgument(state, name, type === "selectordinal", depth, start);
        case "select":
            expect(state, ",");
            return { kind: "select", name, options: parseOptions(state, depth, inPlural, false, start) };
        default:
            throw new IcuSyntaxError(
                type == null ? "Expected an argument type" : `Unsupported argument type "${type}"`,
                typeStart
            );
    }
}

function parseMessage(state: ParserState, depth: number, inPlural: boolean, nested: boolean): readonly IcuElement[] {
    const { source } = state;
    const elements: IcuElement[] = [];
    let text = "";
    const flush = (): void => {
        if (text !== "") {
            elements.push({ kind: "literal", value: text });
            text = "";
        }
    };

    while (state.pos < source.length) {
        const char = source[state.pos];
        if (char === "'") {
            text += readApostrophe(state, inPlural);
        } else if (char === "{") {
            flush();
            elements.push(parseArgument(state, depth + 1, inPlural));
        } else if (char === "}") {
            if (nested) {
                break;
            }
            throw new IcuSyntaxError('Unexpected "}"', state.pos);
        } else if (char === "#" && inPlural) {
            flush();
            elements.push({ kind: "pound" });
            state.pos++;
        } else {
            text += char;
            state.pos++;
        }
    }
    flush();
    return elements;
}

function parseNumberArgument(state: ParserState, name: string): IcuNumberElement {
    if (state.source[state.pos] === "}") {
        state.pos++;
        return { kind: "number", name };
    }
    expect(state, ",");
    const styleStart = state.pos;
    const end = state.source.indexOf("}", state.pos);
    if (end < 0) {
        throw new IcuSyntaxError('Expected "}" but the message ended', state.source.length);
    }
    const style = state.source.slice(state.pos, end).trim();
    state.pos = end + 1;

    if (style === "integer") {
        return { kind: "number", name, options: NUMBER_SKELETON_OPTIONS["precision-integer"] };
    }
    if (style === "percent") {
        return { kind: "number", name, options: NUMBER_SKELETON_OPTIONS["percent"] };
    }
    if (style.startsWith("::")) {
        let options: Intl.NumberFormatOptions = {};
        for (const token of style.slice(2).trim().split(/\s+/)) {
            if (!Object.hasOwn(NUMBER_SKELETON_OPTIONS, token)) {
                throw new IcuSyntaxError(`Unsupported number skeleton "${token}"`, styleStart);
            }
            options = { ...options, ...NUMBER_SKELETON_OPTIONS[token] };
        }
        return { kind: "number", name, options };
    }
    throw new IcuSyntaxError(`Unsupported number style "${style}"`, styleStart);
}

/**
 * Parses the `selector {message}` pairs that follow the comma after the argument type (and offset), up to and including the argument's closing brace. Every plural and select must
 * have an `other` option, which is used when no other selector matches.
 */
function parseOptions(
    state: ParserState,
    depth: number,
    inPlural: boolean,
    plural: boolean,
    argumentStart: number
): ReadonlyMap<string, readonly IcuElement[]> {
    skipWhitespace(state);
    const options = new Map<string, readonly IcuElement[]>();
    while (state.source[state.pos] !== "}") {
        if (state.pos >= state.source.length) {
            throw new IcuSyntaxError('Expected "}" but the message ended', state.pos);
        }
        const selectorStart = state.pos;
        const selector =
            (plural ? match(state, EXACT_SELECTOR_REGEX)?.[0] : undefined) ?? match(state, KEYWORD_REGEX)?.[0];
        if (selector == null) {
            throw new IcuSyntaxError("Expected a selector", selectorStart);
        }
        if (plural && !selector.startsWith("=") && !PLURAL_CATEGORIES.has(selector)) {
            throw new IcuSyntaxError(`Unknown plural category "${selector}"`, selectorStart);
        }
        if (options.has(selector)) {
            throw new IcuSyntaxError(`Duplicate selector "${selector}"`, selectorStart);
        }
        skipWhitespace(state);
        expect(state, "{");
        options.set(selector, parseMessage(state, depth, inPlural || plural, true));
        expect(state, "}");
        skipWhitespace(state);
    }
    state.pos++;
    if (!options.has("other")) {
        throw new IcuSyntaxError('Missing the "other" option', argumentStart, "missing-other");
    }
    return options;
}

function parsePluralArgument(
    state: ParserState,
    name: string,
    ordinal: boolean,
    depth: number,
    argumentStart: number
): IcuPluralElement {
    expect(state, ",");
    skipWhitespace(state);
    const offset = Number(match(state, OFFSET_REGEX)?.[1] ?? 0);
    return { kind: "plural", name, offset, options: parseOptions(state, depth, true, true, argumentStart), ordinal };
}

/**
 * Reads apostrophe quoting at the current position. `''` is one apostrophe. An apostrophe before `{`, `}`, or `#`
 * inside a plural starts quoted text, which ends at the next single apostrophe. Any other apostrophe is literal.
 */
function readApostrophe(state: ParserState, inPlural: boolean): string {
    const { source } = state;
    const next = source[state.pos + 1];
    if (next === "'") {
        state.pos += 2;
        return "'";
    }
    if (next !== "{" && next !== "}" && !(next === "#" && inPlural)) {
        state.pos++;
        return "'";
    }
    state.pos++;
    let text = "";
    while (state.pos < source.length) {
        if (source[state.pos] === "'") {
            if (source[state.pos + 1] === "'") {
                text += "'";
                state.pos += 2;
                continue;
            }
            state.pos++;
            break;
        }
        text += source[state.pos];
        state.pos++;
    }
    return text;
}

function skipWhitespace(state: ParserState): void {
    match(state, WHITESPACE_REGEX);
}
