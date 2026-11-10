import { ComponentMetadata } from "../models/ComponentMetadata";
import { ComponentConfigInputType } from "./componentConfig";

type ClassifiedType =
    | { kind: "boolean" }
    | { kind: "dropdown"; options: string[]; clearable?: boolean }
    | { kind: "number"; nullable: boolean }
    | { kind: "optionalBoolean" }
    | { kind: "string" };

export interface DeriveInputConfigOptions {
    /**
     * Also derive a control for a type alias of string literals (from the metadata's `options`), and for a primitive
     * that may be `undefined`. Pair it with {@link normalizeOptionalValues}, which turns a cleared control back into
     * `undefined`. Opt-in, because a demo whose wrapper doesn't declare those inputs would be handed values it can't
     * take.
     */
    readonly resolveAliases?: boolean;
}

/** The choices of a `boolean | undefined` input, where `undefined` lets the component decide. */
export const OPTIONAL_BOOLEAN_CHOICES: readonly { readonly text: string; readonly value: boolean | undefined }[] = [
    { text: "Automatic", value: undefined },
    { text: "On", value: true },
    { text: "Off", value: false }
];

/**
 * Derives a baseline `ComponentConfigInputType<T>` from build-time component metadata (see
 * `extract-metadata.ts`), so demo authors don't have to hand-retype each input's type and default
 * value. Only `boolean`, `string`, `number`/nullable-number, and pure quoted-string-literal-union
 * types are classified - anything else (generics, function types, object/CSS types, iterables) is
 * omitted entirely rather than guessed, since there's no safe way to derive a demo control or a
 * curated value list for it.
 *
 * `overrides` is shallow-merged on top: any key present in `overrides` fully replaces the derived
 * entry for that key (never deep-merged), except that it keeps the metadata's `alias` unless it sets its own - this is how authors add numeric slider ranges, curated
 * dropdown option lists, notes, aliases, or reintroduce an unclassifiable input by hand.
 */
export function deriveInputConfig<T>(
    metadata: ComponentMetadata,
    overrides: Partial<ComponentConfigInputType<T>>,
    options: DeriveInputConfigOptions = {}
): ComponentConfigInputType<T> {
    const derived: Record<string, unknown> = {};

    for (const property of metadata.inputs ?? []) {
        if (property.kind !== "input" && property.kind !== "model") {
            continue;
        }
        const classified =
            classifyType(property.type) ??
            (options.resolveAliases ? classifyResolvedType(property.type, property.options) : undefined);
        if (!classified) {
            continue;
        }
        const entry = buildEntry(classified, property.defaultValue) as Record<string, unknown>;
        derived[property.name] = property.alias ? { ...entry, alias: property.alias } : entry;
    }

    // An override keeps the metadata's alias unless it names one, so samples show the name consumers bind.
    const aliased: Record<string, unknown> = {};
    for (const [key, override] of Object.entries(overrides as Record<string, Record<string, unknown> | undefined>)) {
        const alias = metadata.inputs?.find(property => property.name === key)?.alias;
        aliased[key] = override && alias && override["alias"] === undefined ? { ...override, alias } : override;
    }

    return { ...derived, ...aliased } as unknown as ComponentConfigInputType<T>;
}

function classifyType(typeString: string): ClassifiedType | undefined {
    const normalized = typeString.trim();
    if (normalized === "boolean") {
        return { kind: "boolean" };
    }
    if (normalized === "string") {
        return { kind: "string" };
    }
    if (normalized === "number") {
        return { kind: "number", nullable: false };
    }
    if (isNumberOrNullUnion(normalized)) {
        return { kind: "number", nullable: true };
    }
    const options = parseQuotedLiteralUnion(normalized);
    if (options) {
        return { kind: "dropdown", options };
    }
    return undefined;
}

/**
 * Values a control can't hold become `undefined` again for the inputs that take it: a cleared number or dropdown gives
 * `null`, and an emptied text box gives `""`. Inputs typed with `null` keep it.
 */
export function normalizeOptionalValues(
    metadata: ComponentMetadata,
    values: Readonly<Record<string, unknown>>
): Record<string, unknown> {
    const result: Record<string, unknown> = { ...values };
    for (const property of metadata.inputs ?? []) {
        const parts = property.type.split("|").map(part => part.trim());
        if (!parts.includes("undefined") || parts.includes("null")) {
            continue;
        }
        const value = result[property.name];
        if (value === null || (value === "" && parts.includes("string"))) {
            result[property.name] = undefined;
        }
    }
    return result;
}

function classifyResolvedType(typeString: string, literalOptions: readonly string[] | undefined): ClassifiedType | undefined {
    const parts = typeString.split("|").map(part => part.trim());
    const optional = parts.includes("undefined") || parts.includes("null");
    if (literalOptions && literalOptions.length > 1) {
        return { kind: "dropdown", options: [...literalOptions], clearable: optional };
    }
    const defined = parts.filter(part => part !== "undefined" && part !== "null");
    if (!optional || defined.length !== 1) {
        return undefined;
    }
    switch (defined[0]) {
        case "boolean":
            return { kind: "optionalBoolean" };
        case "number":
            return { kind: "number", nullable: true };
        case "string":
            return { kind: "string" };
        default:
            return undefined;
    }
}

function isNumberOrNullUnion(typeString: string): boolean {
    const parts = typeString.split("|").map(part => part.trim());
    return parts.length === 2 && parts.includes("number") && parts.includes("null");
}

function parseQuotedLiteralUnion(typeString: string): string[] | undefined {
    const parts = typeString.split("|").map(part => part.trim());
    if (parts.length < 2) {
        return undefined;
    }
    const values: string[] = [];
    for (const part of parts) {
        const match = part.match(/^"([^"]*)"$/) ?? part.match(/^'([^']*)'$/);
        if (!match) {
            return undefined;
        }
        values.push(match[1]);
    }
    return values;
}

function buildEntry(classified: ClassifiedType, rawDefaultValue: string | undefined): unknown {
    const coerced = coerceDefaultValue(rawDefaultValue);
    switch (classified.kind) {
        case "boolean":
            return { type: "boolean", value: typeof coerced === "boolean" ? coerced : false };
        case "string":
            return { type: "string", value: typeof coerced === "string" ? coerced : "" };
        case "number":
            return {
                type: "number",
                nullable: classified.nullable,
                value: typeof coerced === "number" ? coerced : classified.nullable ? null : 0
            };
        case "dropdown":
            if (classified.clearable) {
                return {
                    type: "dropdown",
                    clearable: true,
                    value: classified.options,
                    defaultValue: typeof coerced === "string" ? coerced : null,
                    placeholder: "Automatic"
                };
            }
            return {
                type: "dropdown",
                value: classified.options,
                defaultValue: typeof coerced === "string" ? coerced : classified.options[0]
            };
        case "optionalBoolean":
            return {
                type: "customDropdown",
                value: OPTIONAL_BOOLEAN_CHOICES,
                textField: "text",
                valueField: "value",
                defaultValue: typeof coerced === "boolean" ? coerced : undefined
            };
    }
}

/**
 * Parses a metadata `defaultValue` string (the JSDoc `@default` tag's text, or a re-serialized
 * literal argument - see `extract-metadata.ts`) into its runtime JS value. Hand-rolled, no `eval`.
 */
function coerceDefaultValue(raw: string | undefined): unknown {
    if (raw === undefined) {
        return undefined;
    }
    const trimmed = raw.trim();
    if (trimmed === "null" || trimmed === "undefined") {
        return null;
    }
    if (trimmed === "true" || trimmed === "false") {
        return trimmed === "true";
    }
    if (trimmed === "[]") {
        return [];
    }
    const quoted = trimmed.match(/^"([^"]*)"$/) ?? trimmed.match(/^'([^']*)'$/) ?? trimmed.match(/^`([^`]*)`$/);
    if (quoted) {
        return quoted[1];
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }
    return undefined;
}
