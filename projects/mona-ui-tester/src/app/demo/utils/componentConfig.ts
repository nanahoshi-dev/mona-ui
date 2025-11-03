import { InputSignal, InputSignalWithTransform, ModelSignal, OutputEmitterRef } from "@angular/core";
import { FeatureConfigHandler } from "./featureInjection";

type GetInputSignalValue<T> =
    T extends InputSignal<infer V> ? V : T extends InputSignalWithTransform<any, infer U> ? U : never;

type GetOutputSignalValue<T> = T extends OutputEmitterRef<infer V> ? V : never;

export type ComponentInputs<TComponent> = {
    [K in keyof TComponent as TComponent[K] extends InputSignalWithTransform<any, any>
        ? K
        : never]?: TComponent[K] extends InputSignalWithTransform<any, any>
        ? GetInputSignalValue<TComponent[K]>
        : never;
};

export type ComponentOutputs<TComponent> = {
    [K in keyof TComponent as TComponent[K] extends OutputEmitterRef<any> ? K : never]?: GetOutputSignalValue<
        TComponent[K]
    >;
};

type GetSignalType<T> = T extends InputSignalWithTransform<any, any> ? T : T extends ModelSignal<any> ? T : never;

export type ComponentInputsAsSignal<TComponent> = {
    [K in keyof TComponent as TComponent[K] extends InputSignalWithTransform<any, any>
        ? K
        : TComponent[K] extends ModelSignal<any>
          ? K
          : never]?: GetSignalType<TComponent[K]>;
};

export type ComponentConfigType =
    | "string"
    | "number"
    | "boolean"
    | "dropdown"
    | "color"
    | "event"
    | "function"
    | "object";

export type ComponentConfigInputType<TComponent> = {
    [key in keyof ComponentInputs<TComponent>]: { alias?: string } & (
        | {
              type: Extract<ComponentConfigType, "string" | "boolean" | "color">;
              value: NonNullable<ComponentInputs<TComponent>[key]>;
          }
        | {
              type: Extract<ComponentConfigType, "number">;
              min?: number | null; // Optional, only for number inputs
              max?: number | null; // Optional, only for number inputs
              nullable?: boolean; // Optional, only for number inputs
              value: ComponentInputs<TComponent>[key];
          }
        | {
              type: Extract<ComponentConfigType, "dropdown">;
              value: Array<NonNullable<ComponentInputs<TComponent>[key]>>;
              defaultValue: ComponentInputs<TComponent>[key];
              clearable?: boolean;
          }
        | {
              type: Extract<ComponentConfigType, "function">;
              value: Function;
          }
        | {
              type: Extract<ComponentConfigType, "object">;
              value?: ComponentInputs<TComponent>[key];
          }
    );
};

export type ComponentConfigOutputType<TComponent> = {
    [key in keyof ComponentOutputs<TComponent>]?: {
        type: "event";
    };
};

export interface ComponentConfigFeatureItemOptions<TDropdown = any> {
    active: boolean;
    code: string;
    codeVisible?: boolean;
    description: string;
    dropdownDataSource?: Iterable<TDropdown>;
    dropdownDefaultValue?: TDropdown; // Only for dropdown type
    dropdownTextField?: string; // Only for dropdown type
    dropdownValue?: TDropdown; // Only for dropdown type
    dropdownValueField?: string; // Only for dropdown type
    hasCode?: boolean;
    name: string;
    numericMax?: number; // Only for number type
    numericMin?: number; // Only for number type
    numericNullable?: boolean; // Only for number type
    numericValue?: number; // Only for number type
    subFeatures?: ComponentConfigFeatureItem;
    type?: "boolean" | "dropdown" | "number"; // Defaults to boolean
}

export interface ComponentConfigFeatureItem {
    [key: string]: ComponentConfigFeatureItemOptions;
}

export type ComponentConfig<TComponent> = {
    code?: string; // TODO: Remove this
    featureHandler?: FeatureConfigHandler;
    inputs: ComponentConfigInputType<TComponent>;
    outputs: ComponentConfigOutputType<TComponent>;
};

export type ProcessedConfigItem<TValue = any, TDefault = any> = {
    alias?: string; // Optional alias for the input
    configType: ComponentConfigType;
    clearable?: boolean; // Only for dropdown inputs
    defaultValue?: TDefault;
    max?: number | null; // Optional, only for number inputs
    min?: number | null; // Optional, only for number inputs
    name: string; // Optional, only for number inputs
    nullable?: boolean; // From the input structure
    value?: TValue; // Runtime JS type of the value
    valueType: "string" | "number" | "boolean" | "array" | "object" | "symbol" | "bigint" | "function" | "undefined";
};

export interface ComponentPropertyConfig {
    inputs: ProcessedConfigItem[];
    outputs: ProcessedConfigItem[];
    templates?: FeatureConfigHandler;
}

export function createComponentPropertyConfig<TComponent>(
    config: ComponentConfig<TComponent>
): ComponentPropertyConfig {
    const inputs = createComponentInputConfigArray(config.inputs);
    const outputs = createComponentOutputConfigArray(config.outputs);
    const templates = config.featureHandler;
    return { inputs, outputs, templates };
}

/**
 * Transforms a ComponentConfigInputType object into an array of objects
 * with 'name', 'configType', 'valueType', and 'value' properties.
 *
 * @param configInput The ComponentConfigInputs object to process.
 * @returns An array of processed configuration objects, including runtime value type.
 * @template TComponent The component type used for ComponentConfigInputs.
 */
export function createComponentInputConfigArray<TComponent>(
    configInput: ComponentConfigInputType<TComponent>
): ProcessedConfigItem[] {
    const processedArray: ProcessedConfigItem[] = [];
    const getRuntimeValueType = (val: any): ProcessedConfigItem["valueType"] => {
        if (Array.isArray(val)) {
            return "array";
        }
        return typeof val;
    };

    for (const key in configInput) {
        if (Object.prototype.hasOwnProperty.call(configInput, key)) {
            const configItem = configInput[key];
            if (!configItem) {
                continue;
            }
            const runtimeValueType = getRuntimeValueType(configItem.value);
            processedArray.push({
                alias: configItem.alias,
                configType: configItem.type,
                clearable: configItem.type === "dropdown" ? configItem.clearable : undefined,
                defaultValue: configItem.type === "dropdown" ? configItem.defaultValue : undefined,
                max: configItem.type === "number" ? (configItem.max ?? null) : undefined,
                min: configItem.type === "number" ? (configItem.min ?? null) : undefined,
                nullable: configItem.type === "number" ? (configItem.nullable ?? false) : undefined,
                name: String(key),
                value: configItem.value,
                valueType: runtimeValueType
            });
        }
    }

    return processedArray;
}

/**
 * Transforms a ComponentConfigInputType object into an array of objects
 * with 'name', 'configType', 'valueType', and 'value' properties.
 *
 * @param configInput The ComponentConfigInputs object to process.
 * @returns An array of processed configuration objects, including runtime value type.
 * @template TComponent The component type used for ComponentConfigInputs.
 */
export function createComponentOutputConfigArray<TComponent>(
    configInput: ComponentConfigOutputType<TComponent>
): ProcessedConfigItem[] {
    const processedArray: ProcessedConfigItem[] = [];
    for (const key in configInput) {
        if (Object.prototype.hasOwnProperty.call(configInput, key)) {
            const configItem = configInput[key];
            if (!configItem) {
                continue;
            }
            processedArray.push({
                configType: "event",
                name: String(key),
                valueType: "function"
            });
        }
    }

    return processedArray;
}

type ExtractedConfigValue<TComponent> = {
    [K in keyof ComponentInputs<TComponent>]: ExtractFirstArrayItem<NonNullable<ComponentInputs<TComponent>[K]>>;
};

type ExtractFirstArrayItem<T> = T extends (infer U)[] ? U : T;

/**
 * Extracts the 'value' property from each item in a ComponentConfigInputs object.
 * If the value is an array, only its first element is taken.
 * Returns a Record where keys are property names and values are the extracted 'value'.
 *
 * @param inputConfig The ComponentConfigInputs object to transform.
 * @returns A record mapping property names to their corresponding values,
 * with array values flattened to their first element.
 * @template TComponent The type of the component being configured.
 */
export function extractConfigValues<TComponent>(
    inputConfig: ComponentConfig<TComponent>
): ExtractedConfigValue<TComponent> {
    const result: ExtractedConfigValue<TComponent> = {} as ExtractedConfigValue<TComponent>;

    const inputs = inputConfig.inputs;
    for (const key in inputs) {
        if (Object.prototype.hasOwnProperty.call(inputs, key)) {
            const configItem = inputs[key];
            if (configItem) {
                let valueToAssign: any;
                if (Array.isArray(configItem.value) && configItem.value.length > 0) {
                    if (configItem.type === "dropdown") {
                        valueToAssign = configItem.defaultValue;
                    } else {
                        valueToAssign = configItem.value[0];
                    }
                } else if (Array.isArray(configItem.value) && configItem.value.length === 0) {
                    valueToAssign = null;
                } else {
                    valueToAssign = configItem.value;
                }
                result[key as keyof ComponentInputs<TComponent>] =
                    valueToAssign as ExtractedConfigValue<TComponent>[typeof key];
            }
        }
    }
    return result;
}
