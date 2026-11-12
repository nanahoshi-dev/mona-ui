import { signal } from "@angular/core";
import { ComponentMetadata } from "../models/ComponentMetadata";
import {
    buildActiveFeatureAttributes,
    buildActiveFeatureContent,
    buildInputAttributes,
    generateComponentCodeSample,
    selectorHostAttribute
} from "./codeSample";
import {
    ComponentConfig,
    ComponentConfigInputType,
    ComponentInputs,
    createComponentInputConfigArray,
    extractConfigValues
} from "./componentConfig";
import { coerceDefaultValue, normalizeOptionalValues } from "./deriveInputConfig";

/**
 * One component of a playground made of several, such as a chart and its series and axes. The first part is the root
 * element, and the others are nested inside it in the code sample.
 */
export interface DemoPart {
    /** Bindings the code sample shows that the panel can't change, such as `[data]="data"`. */
    readonly codeAttributes?: readonly string[];
    /** Markup the code sample writes inside this part's element, before the parts nested in it, such as a row's label. */
    readonly codeContent?: readonly string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Parts of different component types share a list.
    readonly config: ComponentConfig<any>;
    /**
     * The element the code sample writes for a directive, such as `button` for `[monaSidebarTrigger]`. Without it, the
     * element its selector names, or a `div` for an attribute selector.
     */
    readonly element?: string;
    readonly id: string;
    readonly metadata: ComponentMetadata;
    /**
     * `false` for markup the code sample shows that the playground doesn't let you change, such as a fixed row or the
     * inset beside a sidebar. It gets no tab of its own.
     */
    readonly panel?: boolean;
    /** The id of the part this one is written inside in the code sample. Without it, the root. */
    readonly parent?: string;
    /**
     * `"host"` for a directive applied to its parent's element, such as `monaGridSortable` on `mona-grid`: its bindings
     * join the parent's attributes instead of nesting as an element of their own. A directive whose options feature is
     * on is written as that binding, otherwise as its bare attribute.
     */
    readonly placement?: "child" | "host";
    readonly title: string;
    /**
     * Elements the code sample wraps this part in, outermost first, each written as its opening tag without the angle
     * brackets, such as `nav monaSidebarContent aria-label="Main"`. Parts next to each other with the same wrapper
     * share one, as rows share their list.
     */
    readonly wrappers?: readonly string[];
}

/**
 * Markup the code sample shows that the playground doesn't let you change, such as a fixed row: a part with no panel,
 * written as the element its selector names.
 */
export function staticPart(
    id: string,
    selector: string,
    options: Pick<DemoPart, "codeAttributes" | "codeContent" | "element" | "parent" | "wrappers"> = {}
): DemoPart {
    return {
        ...options,
        config: { inputs: {} },
        id,
        metadata: { inputs: [], name: "", selector },
        panel: false,
        title: id
    };
}

/** The current input values of each part, by part id. */
export type DemoPartValues = Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/**
 * Every input a part's panel controls, as the component takes it. The keys are required because a playground binds
 * all of them, and a value the panel holds as `null` or `""` is already `undefined` where the input expects that.
 */
export type DemoInputValues<TComponent> = {
    [K in keyof ComponentInputs<TComponent>]-?: ComponentInputs<TComponent>[K];
};

/**
 * The values of each part, keeping what the user changed for parts that are still there and starting new parts from
 * their configured values. Use it as a `linkedSignal` computation over the parts.
 */
export function reconcilePartValues(parts: readonly DemoPart[], previous?: DemoPartValues): DemoPartValues {
    return Object.fromEntries(
        parts.map(part => [
            part.id,
            { ...extractConfigValues(part.config), ...(previous?.[part.id] ?? {}) } as Record<string, unknown>
        ])
    );
}

/** A part's values, ready to bind: cleared controls become `undefined` where the input takes it. */
export function readPartValues<TComponent>(
    part: DemoPart | undefined,
    values: DemoPartValues
): DemoInputValues<TComponent> {
    if (!part) {
        return {} as DemoInputValues<TComponent>;
    }
    return normalizeOptionalValues(part.metadata, values[part.id] ?? {}) as DemoInputValues<TComponent>;
}

/**
 * The part's config with its live values, so a panel that is shown again, as when switching tabs, starts from what the
 * user set rather than from the defaults.
 */
export function applyLiveValues<TComponent>(
    config: ComponentConfig<TComponent>,
    values: Readonly<Record<string, unknown>> | undefined
): ComponentConfig<TComponent> {
    if (!values) {
        return config;
    }
    const inputs: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(config.inputs as Record<string, Record<string, unknown> | undefined>)) {
        if (!entry || !(key in values)) {
            inputs[key] = entry;
            continue;
        }
        const value = values[key];
        inputs[key] =
            entry["type"] === "dropdown" || entry["type"] === "customDropdown"
                ? { ...entry, defaultValue: value }
                : entry["type"] === "iterable" || entry["type"] === "function" || entry["type"] === "object"
                  ? entry
                  : { ...entry, value };
    }
    return { ...config, inputs: inputs as ComponentConfigInputType<TComponent> };
}

/** The markup of the whole playground: the first part's element, with the others inside it or inside their parent. */
export function generatePartsCodeSample(
    parts: readonly DemoPart[],
    values: DemoPartValues,
    content: readonly string[] = []
): string {
    const featureAttributes = (part: DemoPart): string[] => {
        const features = part.config.featureHandler?.data();
        const inputNames = new Set((part.metadata.inputs ?? []).map(input => input.name));
        return features ? buildActiveFeatureAttributes(features, inputNames) : [];
    };
    const featureContent = (part: DemoPart, position: "end" | "start" = "end"): string[] => {
        const features = part.config.featureHandler?.data();
        const inputNames = new Set((part.metadata.inputs ?? []).map(input => input.name));
        return features ? buildActiveFeatureContent(features, inputNames, position) : [];
    };
    const inputAttributes = (part: DemoPart): string[] => {
        const partValues = values[part.id] ?? {};
        const items = createComponentInputConfigArray(part.config.inputs)
            .filter(item => !isComponentDefault(part.metadata, item.name, partValues[item.name] ?? item.value))
            .map(item => withComponentBaseline(part.metadata, item));
        return buildInputAttributes(items, partValues);
    };
    const hostBindings = (part: DemoPart): string[] => {
        const attribute = selectorHostAttribute(part.metadata.selector ?? "");
        const bindings = [...(part.codeAttributes ?? []), ...inputAttributes(part), ...featureAttributes(part)];
        const bound = attribute && bindings.some(binding => binding.startsWith(`[${attribute}]=`));
        return attribute && !bound ? [attribute, ...bindings] : bindings;
    };
    const [root, ...others] = parts;
    if (!root) {
        return "";
    }
    const nestedIn = (part: DemoPart, placement: "child" | "host"): DemoPart[] =>
        others.filter(other => (other.parent ?? root.id) === part.id && (other.placement ?? "child") === placement);
    const render = (part: DemoPart): string => {
        const hosted = nestedIn(part, "host");
        return generateComponentCodeSample(
            elementSelector(part),
            [],
            {},
            [
                ...(part.codeAttributes ?? []),
                ...inputAttributes(part),
                ...featureAttributes(part),
                ...hosted.flatMap(hostBindings)
            ],
            [
                ...featureContent(part, "start"),
                ...(part.codeContent ?? []),
                ...renderWrapped(
                    nestedIn(part, "child").map(child => ({ part: child, wrappers: child.wrappers ?? [] }))
                ),
                ...hosted.flatMap(hostedPart => featureContent(hostedPart)),
                ...(part === root ? content : []),
                ...featureContent(part)
            ]
        );
    };
    const renderWrapped = (siblings: readonly WrappedPart[]): string[] => {
        const rendered: string[] = [];
        for (let index = 0; index < siblings.length;) {
            const wrapper = siblings[index].wrappers[0];
            if (wrapper === undefined) {
                rendered.push(render(siblings[index].part));
                index++;
                continue;
            }
            let end = index;
            while (end < siblings.length && siblings[end].wrappers[0] === wrapper) {
                end++;
            }
            const inner = renderWrapped(
                siblings.slice(index, end).map(sibling => ({ part: sibling.part, wrappers: sibling.wrappers.slice(1) }))
            );
            rendered.push(wrapElement(wrapper, inner));
            index = end;
        }
        return rendered;
    };
    return render(root);
}

interface WrappedPart {
    readonly part: DemoPart;
    readonly wrappers: readonly string[];
}

/** The selector the code sample writes a part as, with its own element in place of the selector's when it names one. */
function elementSelector(part: DemoPart): string {
    const selector = part.metadata.selector ?? "";
    if (!part.element) {
        return selector;
    }
    const attribute = selectorHostAttribute(selector);
    return attribute ? `${part.element}[${attribute}]` : part.element;
}

/** The content inside one wrapper, written as its opening tag without the angle brackets. */
function wrapElement(wrapper: string, content: readonly string[]): string {
    const [tag, ...attributes] = wrapper.split(" ");
    const attributeText = attributes.join(" ");
    return generateComponentCodeSample(tag, [], {}, attributeText ? [attributeText] : [], [...content]);
}

/**
 * Whether a value is what the input already defaults to, by the metadata read from the component's source, so the code
 * sample can leave it out. Only a literal default can be compared: a number, a boolean or a quoted string.
 */
function isComponentDefault(metadata: ComponentMetadata, name: string, value: unknown): boolean {
    const defaultValue = literalDefault(metadata, name);
    return defaultValue !== undefined && value === defaultValue;
}

/**
 * The item with the component's own default as the value the sample leaves out. A dropdown otherwise treats the value
 * the playground starts on as that, and would leave out a value the component wouldn't have chosen by itself.
 */
function withComponentBaseline<TItem extends { defaultValue?: unknown; name: string }>(
    metadata: ComponentMetadata,
    item: TItem
): TItem {
    const defaultValue = literalDefault(metadata, item.name);
    return defaultValue === undefined ? item : { ...item, defaultValue };
}

/** The input's default from the metadata, when it is a literal the sample can compare a value with. */
function literalDefault(metadata: ComponentMetadata, name: string): boolean | number | string | undefined {
    const input = metadata.inputs?.find(property => property.name === name);
    if (!input || input.defaultValue === undefined) {
        return undefined;
    }
    const defaultValue = coerceDefaultValue(input.defaultValue);
    return typeof defaultValue === "number" || typeof defaultValue === "boolean" || typeof defaultValue === "string"
        ? defaultValue
        : undefined;
}

export interface DemoEventEntry {
    readonly id: number;
    readonly name: string;
    readonly value: string;
}

/** The events a playground's components emitted, newest first, for its Events tab. */
export class DemoEventLog {
    readonly #entries = signal<readonly DemoEventEntry[]>([]);
    #nextId = 0;
    public readonly entries = this.#entries.asReadonly();

    public clear(): void {
        this.#entries.set([]);
    }

    public record(name: string, value: unknown): void {
        const entry: DemoEventEntry = { id: this.#nextId++, name, value: stringifyEvent(value) };
        this.#entries.update(entries => [entry, ...entries].slice(0, 50));
    }
}

function stringifyEvent(value: unknown): string {
    const seen = new WeakSet<object>();
    try {
        return (
            JSON.stringify(
                value,
                (key, item: unknown) => {
                    if (typeof item === "function") {
                        return "[Function]";
                    }
                    if (item && typeof item === "object") {
                        if (seen.has(item)) {
                            return "[Circular]";
                        }
                        seen.add(item);
                        if (typeof Node !== "undefined" && item instanceof Node) {
                            return `[${item.nodeName}]`;
                        }
                    }
                    return item;
                },
                2
            ) ?? String(value)
        );
    } catch {
        return String(value);
    }
}
