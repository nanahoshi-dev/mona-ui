import { InputSignal, InputSignalWithTransform, ModelSignal, OutputEmitterRef } from "@angular/core";
import { ComponentMetadata } from "../models/ComponentMetadata";
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

export type ComponentConfigType = "string" | "number" | "boolean" | "dropdown" | "color" | "event";

export type ComponentConfigInputType<TComponent> = {
    [key in keyof ComponentInputs<TComponent>]:
        | {
              type: Extract<ComponentConfigType, "string" | "number" | "boolean" | "color">;
              value: NonNullable<ComponentInputs<TComponent>[key]>;
          }
        | {
              type: Extract<ComponentConfigType, "dropdown">;
              value: Array<NonNullable<ComponentInputs<TComponent>[key]>>;
              defaultValue: ComponentInputs<TComponent>[key];
          };
};

export type ComponentConfigOutputType<TComponent> = {
    [key in keyof ComponentOutputs<TComponent>]?: {
        type: "event";
    };
};

export interface ComponentConfigFeatureItem {
    [key: string]: {
        active: boolean;
        code: string;
        codeVisible?: boolean;
        description: string;
        name: string;
    };
}

export type ComponentConfig<TComponent> = {
    code?: string; // TODO: Remove this
    featureHandler?: FeatureConfigHandler;
    inputs: ComponentConfigInputType<TComponent>;
    outputs: ComponentConfigOutputType<TComponent>;
};

export type ProcessedConfigItem<TValue = any, TDefault = any> = {
    configType: ComponentConfigType;
    defaultValue?: TDefault;
    name: string; // From the input structure
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
                configType: configItem.type,
                defaultValue: configItem.type === "dropdown" ? configItem.defaultValue : undefined,
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
export function extractConfigValues<TComponent>(inputConfig: ComponentConfig<TComponent>): {
    [K in keyof ComponentInputs<TComponent>]: ExtractFirstArrayItem<NonNullable<ComponentInputs<TComponent>[K]>>;
} {
    type ReturnType = {
        [K in keyof ComponentInputs<TComponent>]: ExtractFirstArrayItem<NonNullable<ComponentInputs<TComponent>[K]>>;
    };
    const result: ReturnType = {} as ReturnType;

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
                result[key as keyof ComponentInputs<TComponent>] = valueToAssign as ReturnType[typeof key];
            }
        }
    }
    return result;
}
