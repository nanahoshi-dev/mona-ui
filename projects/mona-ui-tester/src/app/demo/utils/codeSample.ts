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
 * empty default) are omitted so the snippet stays minimal. `additionalAttributes` (see
 * {@link buildActiveFeatureAttributes}) are appended as-is after the derived input bindings, so
 * currently-enabled Features-tab entries can be folded into the same top-level sample.
 * `additionalContent` (see {@link buildActiveFeatureContent}) is rendered as nested markup
 * between the opening and closing tags, for active template/content-projection features.
 */
export function generateComponentCodeSample(
    selector: string,
    items: ProcessedConfigItem[],
    currentValues: Record<string, unknown>,
    additionalAttributes: string[] = [],
    additionalContent: string[] = []
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

    attributes.push(...additionalAttributes);

    return formatElement(tag, attributes, additionalContent);
}

/**
 * Builds one binding string per currently-active top-level Features-tab entry, for folding into
 * the top-level code sample alongside the plain input bindings. Only features with a
 * `directiveBinding` (a whole options object bound to one directive input, e.g.
 * `[monaDropDownFilterable]="{...}"`) or whose key matches a real input on the component being
 * demoed are included - template/content-projection features (e.g. a custom prefix template)
 * have no attribute-level representation and are left out, same as the per-feature code panel's
 * fallback behavior.
 */
export function buildActiveFeatureAttributes(
    features: ComponentConfigFeatureItem,
    metadataInputNames: ReadonlySet<string>
): string[] {
    const attributes: string[] = [];
    for (const [key, item] of Object.entries(features)) {
        if (!item.active) {
            continue;
        }
        if (item.directiveBinding) {
            attributes.push(
                `[${item.directiveBinding.hostAttribute}]="${formatBindingValue(item.directiveBinding.buildValue(features))}"`
            );
        } else if (metadataInputNames.has(key)) {
            attributes.push(`[${key}]="${formatBindingValue(resolveFeatureValue(item))}"`);
        }
    }
    return attributes;
}

/**
 * Builds one markup block per currently-active Features-tab entry - at any nesting depth, since a
 * template feature (e.g. a group header template) is often a sub-feature of a parent toggle like
 * "Grouping" - that has a hand-authored `code` sample and isn't already represented as an
 * attribute by {@link buildActiveFeatureAttributes}. Each block is dedented so it composes
 * cleanly as nested content in the top-level sample.
 */
export function buildActiveFeatureContent(
    features: ComponentConfigFeatureItem,
    metadataInputNames: ReadonlySet<string>
): string[] {
    const content: string[] = [];
    collectActiveFeatureContent(features, metadataInputNames, content);
    return content;
}

function collectActiveFeatureContent(
    features: ComponentConfigFeatureItem,
    metadataInputNames: ReadonlySet<string>,
    content: string[]
): void {
    for (const [key, item] of Object.entries(features)) {
        if (!item.active) {
            continue;
        }
        if (!item.directiveBinding && !metadataInputNames.has(key) && item.code && item.code.trim().length > 0) {
            content.push(dedent(item.code));
        }
        if (item.subFeatures) {
            collectActiveFeatureContent(item.subFeatures, metadataInputNames, content);
        }
    }
}

/**
 * Strips a single leading/trailing blank line and the common leading whitespace from a
 * multi-line string, mirroring `CodeViewerComponent`'s own display normalization so hand-authored
 * `code` template literals compose correctly wherever they're reused.
 */
export function dedent(code: string): string {
    const lines = code.split("\n");

    if (lines[0]?.trim() === "") {
        lines.shift();
    }
    if (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
    }
    if (lines.length === 0) {
        return "";
    }

    const minIndent = lines.reduce((min, line) => {
        if (line.trim().length === 0) {
            return min;
        }
        const indent = line.match(/^\s*/)?.[0].length ?? 0;
        return Math.min(min, indent);
    }, Infinity);

    if (minIndent === Infinity) {
        return lines.join("\n");
    }
    return lines.map(line => line.substring(minIndent)).join("\n");
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

/**
 * Renders a feature's `directiveBinding` (a whole options object bound to one directive input,
 * e.g. `[monaDropDownFilterable]="{...}"`) from live feature state, wrapped in the demoed
 * component's own element tag so the sample reads as real, pasteable usage rather than a bare
 * attribute. Takes priority over both a hand-authored `code` string and
 * {@link generateFeatureCodeSample} - see `ConfigComponent`.
 */
export function generateDirectiveBindingCodeSample(
    selector: string,
    binding: NonNullable<FeatureItem["directiveBinding"]>,
    allFeatures: ComponentConfigFeatureItem
): string {
    const { tag } = parseSelector(selector);
    const attribute = `[${binding.hostAttribute}]="${formatBindingValue(binding.buildValue(allFeatures))}"`;
    return formatElement(tag, [attribute]);
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

function formatElement(tag: string, attributes: string[], content: string[] = []): string {
    if (content.length === 0) {
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

    const openTag = formatOpenTag(tag, attributes);
    const indentedContent = content.map(block => indentLines(block, 4)).join("\n");
    return `${openTag}\n${indentedContent}\n</${tag}>`;
}

function formatOpenTag(tag: string, attributes: string[]): string {
    if (attributes.length === 0) {
        return `<${tag}>`;
    }
    const singleLine = `<${tag} ${attributes.join(" ")}>`;
    if (singleLine.length <= 80) {
        return singleLine;
    }
    return `<${tag}\n${attributes.map(attribute => `    ${attribute}`).join("\n")}>`;
}

function indentLines(text: string, spaces: number): string {
    const prefix = " ".repeat(spaces);
    return text
        .split("\n")
        .map(line => (line.length > 0 ? `${prefix}${line}` : line))
        .join("\n");
}
