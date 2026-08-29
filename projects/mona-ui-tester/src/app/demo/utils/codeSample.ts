import { ComponentConfigFeatureItem, ProcessedConfigItem } from "./componentConfig";

type FeatureItem = ComponentConfigFeatureItem[string];

const NON_BINDABLE_CONFIG_TYPES: ReadonlySet<ProcessedConfigItem["configType"]> = new Set([
    "event",
    "iterable",
    "function",
    "object",
    "customDropdown"
]);

/**
 * Generates an Angular template usage snippet for a component/directive from its selector,
 * its processed config items, and the current live values of those items. Attributes whose
 * resolved value matches the item's baseline (its configured default, or a type-appropriate
 * empty default) are omitted so the snippet stays minimal.
 */
export function generateComponentCodeSample(
    selector: string,
    items: ProcessedConfigItem[],
    currentValues: Record<string, unknown>
): string {
    const { tag, hostAttribute } = parseSelector(selector);
    const attributes: string[] = [];

    if (hostAttribute) {
        attributes.push(hostAttribute);
    }

    for (const item of items) {
        if (item.disabled || NON_BINDABLE_CONFIG_TYPES.has(item.configType)) {
            continue;
        }
        const resolvedValue = resolveDisplayValue(item, currentValues);
        if (isBaselineValue(item, resolvedValue)) {
            continue;
        }
        attributes.push(`[${item.alias ?? item.name}]="${formatBindingValue(resolvedValue)}"`);
    }

    return formatElement(tag, attributes);
}

/**
 * Generates a single-attribute usage snippet for a Features-tab entry that happens to mirror a
 * real input on the component being demoed (e.g. a boolean feature named the same as a boolean
 * input). Only meaningful when such a match exists - callers are expected to check for one
 * first (see `ConfigComponent`) since most feature entries model directive-level composite
 * options that have no such 1:1 mapping and must keep a hand-authored `code` sample instead.
 */
export function generateFeatureCodeSample(selector: string, key: string, item: FeatureItem): string {
    const value = resolveFeatureValue(item);
    const processedItem: ProcessedConfigItem = {
        configType: mapFeatureConfigType(item.type),
        defaultValue: item.type === "dropdown" ? item.dropdownDefaultValue : undefined,
        name: key,
        value,
        valueType: (Array.isArray(value) ? "array" : typeof value) as ProcessedConfigItem["valueType"]
    };
    return generateComponentCodeSample(selector, [processedItem], { [key]: value });
}

function mapFeatureConfigType(type: FeatureItem["type"]): ProcessedConfigItem["configType"] {
    switch (type) {
        case "number":
            return "number";
        case "dropdown":
            return "dropdown";
        case "string":
            return "string";
        default:
            return "boolean";
    }
}

function resolveFeatureValue(item: FeatureItem): unknown {
    switch (item.type) {
        case "number":
            return item.numericValue;
        case "dropdown":
            return item.dropdownValue;
        case "string":
            return item.stringValue;
        default:
            return item.active ?? false;
    }
}

function resolveDisplayValue(item: ProcessedConfigItem, currentValues: Record<string, unknown>): unknown {
    if (Object.prototype.hasOwnProperty.call(currentValues, item.name) && currentValues[item.name] !== undefined) {
        return currentValues[item.name];
    }
    if (item.defaultValue !== undefined) {
        return item.defaultValue;
    }
    if (Array.isArray(item.value)) {
        return item.value[0];
    }
    return item.value;
}

function isBaselineValue(item: ProcessedConfigItem, resolvedValue: unknown): boolean {
    if (resolvedValue === null || resolvedValue === undefined) {
        return true;
    }
    if (item.defaultValue !== undefined) {
        return resolvedValue === item.defaultValue;
    }
    switch (item.configType) {
        case "boolean":
            return resolvedValue === false;
        case "string":
        case "color":
            return resolvedValue === "";
        default:
            return false;
    }
}

function formatBindingValue(value: unknown): string {
    if (typeof value === "string") {
        return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
    }
    return JSON.stringify(value);
}

interface ParsedSelector {
    hostAttribute?: string;
    tag: string;
}

/**
 * Parses a raw selector captured from source (may still be quoted, e.g. from a ts-morph
 * `getText()` call) into an element tag and, for attribute-selector directives such as
 * `textarea[monaTextArea]` or `[monaSomething]`, the bare host attribute to render alongside it.
 */
function parseSelector(rawSelector: string): ParsedSelector {
    const unquoted = unquote(rawSelector).split(",")[0].trim();

    const tagWithAttrMatch = unquoted.match(/^([a-zA-Z][a-zA-Z0-9-]*)\[([a-zA-Z][a-zA-Z0-9-]*)]$/);
    if (tagWithAttrMatch) {
        return { tag: tagWithAttrMatch[1], hostAttribute: tagWithAttrMatch[2] };
    }

    const attrOnlyMatch = unquoted.match(/^\[([a-zA-Z][a-zA-Z0-9-]*)]$/);
    if (attrOnlyMatch) {
        return { tag: "div", hostAttribute: attrOnlyMatch[1] };
    }

    return { tag: unquoted || "div" };
}

function unquote(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length >= 2) {
        const first = trimmed[0];
        const last = trimmed[trimmed.length - 1];
        if ((first === '"' || first === "'") && first === last) {
            return trimmed.slice(1, -1);
        }
    }
    return trimmed;
}

function formatElement(tag: string, attributes: string[]): string {
    if (attributes.length === 0) {
        return `<${tag}></${tag}>`;
    }

    const singleLine = `<${tag} ${attributes.join(" ")}></${tag}>`;
    if (singleLine.length <= 80) {
        return singleLine;
    }

    const indentedAttributes = attributes.map(attribute => `    ${attribute}`).join("\n");
    return `<${tag}\n${indentedAttributes}>\n</${tag}>`;
}
