import { ComponentMetadata } from "../models/ComponentMetadata";
import { ComponentConfigInputType } from "./componentConfig";

type ClassifiedType =
    | { kind: "boolean" }
    | { kind: "dropdown"; options: string[] }
    | { kind: "number"; nullable: boolean }
    | { kind: "string" };

/**
 * Derives a baseline `ComponentConfigInputType<T>` from build-time component metadata (see
 * `extract-metadata.ts`), so demo authors don't have to hand-retype each input's type and default
 * value. Only `boolean`, `string`, `number`/nullable-number, and pure quoted-string-literal-union
 * types are classified - anything else (generics, function types, object/CSS types, iterables) is
 * omitted entirely rather than guessed, since there's no safe way to derive a demo control or a
 * curated value list for it.
 *
 * `overrides` is shallow-merged on top: any key present in `overrides` fully replaces the derived
 * entry for that key (never deep-merged) - this is how authors add numeric slider ranges, curated
 * dropdown option lists, notes, aliases, or reintroduce an unclassifiable input by hand.
 */
export function deriveInputConfig<T>(
    metadata: ComponentMetadata,
    overrides: Partial<ComponentConfigInputType<T>>
): ComponentConfigInputType<T> {
    const derived: Record<string, unknown> = {};

    for (const property of metadata.inputs ?? []) {
        if (property.kind !== "input" && property.kind !== "model") {
            continue;
        }
        const classified = classifyType(property.type);
        if (!classified) {
            continue;
        }
        derived[property.name] = buildEntry(classified, property.defaultValue);
    }

    return { ...derived, ...overrides } as unknown as ComponentConfigInputType<T>;
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
            return {
                type: "dropdown",
                value: classified.options,
                defaultValue: typeof coerced === "string" ? coerced : classified.options[0]
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
