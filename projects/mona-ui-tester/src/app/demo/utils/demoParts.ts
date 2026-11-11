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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Parts of different component types share a list.
    readonly config: ComponentConfig<any>;
    readonly id: string;
    readonly metadata: ComponentMetadata;
    /**
     * `"host"` for a directive applied to the root's element, such as `monaGridSortable` on `mona-grid`: its bindings
     * join the root's attributes instead of nesting as an element of their own. A directive whose options feature is
     * on is written as that binding, otherwise as its bare attribute.
     */
    readonly placement?: "child" | "host";
    readonly title: string;
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

/** The markup of the whole playground: the first part's element, with the others inside it. */
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
    const featureContent = (part: DemoPart): string[] => {
        const features = part.config.featureHandler?.data();
        const inputNames = new Set((part.metadata.inputs ?? []).map(input => input.name));
        return features ? buildActiveFeatureContent(features, inputNames) : [];
    };
    const inputAttributes = (part: DemoPart): string[] => {
        const partValues = values[part.id] ?? {};
        const items = createComponentInputConfigArray(part.config.inputs).filter(
            item => !isComponentDefault(part.metadata, item.name, partValues[item.name] ?? item.value)
        );
        return buildInputAttributes(items, partValues);
    };
    const render = (part: DemoPart, children: string[] = [], hostAttributes: string[] = []): string =>
        generateComponentCodeSample(
            part.metadata.selector ?? "",
            [],
            {},
            [...(part.codeAttributes ?? []), ...inputAttributes(part), ...featureAttributes(part), ...hostAttributes],
            [...children, ...featureContent(part)]
        );
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
    const hosted = others.filter(part => part.placement === "host");
    const children = others.filter(part => part.placement !== "host");
    return render(
        root,
        [...children.map(child => render(child)), ...hosted.flatMap(featureContent), ...content],
        hosted.flatMap(hostBindings)
    );
}

/**
 * Whether a value is what the input already defaults to, by the metadata read from the component's source, so the code
 * sample can leave it out. Only a literal default can be compared: a number, a boolean or a quoted string.
 */
function isComponentDefault(metadata: ComponentMetadata, name: string, value: unknown): boolean {
    const input = metadata.inputs?.find(property => property.name === name);
    if (!input || input.defaultValue === undefined) {
        return false;
    }
    const defaultValue = coerceDefaultValue(input.defaultValue);
    return (
        (typeof defaultValue === "number" || typeof defaultValue === "boolean" || typeof defaultValue === "string") &&
        value === defaultValue
    );
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
