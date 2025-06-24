import { InputSignal, InputSignalWithTransform, ModelSignal } from "@angular/core";

type GetInputSignalValue<T> =
    T extends InputSignal<infer V> ? V : T extends InputSignalWithTransform<any, infer U> ? U : never;

export type ComponentInputs<TComponent> = {
    [K in keyof TComponent as TComponent[K] extends InputSignalWithTransform<any, any>
        ? K
        : never]?: TComponent[K] extends InputSignalWithTransform<any, any>
        ? GetInputSignalValue<TComponent[K]>
        : never;
};

type GetSignalType<T> = T extends InputSignalWithTransform<any, any> ? T : T extends ModelSignal<any> ? T : never;

export type ComponentInputsAsSignal<TComponent> = {
    [K in keyof TComponent as TComponent[K] extends InputSignalWithTransform<any, any>
        ? K
        : TComponent[K] extends ModelSignal<any>
          ? K
          : never]?: GetSignalType<TComponent[K]>; // This is the correct way to handle multiple conditions
};

export type ComponentConfigType = "string" | "number" | "boolean" | "dropdown" | "color";

export type ComponentConfig<TComponent> = {
    [key in keyof ComponentInputs<TComponent>]: (
        | {
              type: Extract<ComponentConfigType, "string" | "number" | "boolean" | "color">;
              value: NonNullable<ComponentInputs<TComponent>[key]>;
          }
        | {
              type: Extract<ComponentConfigType, "dropdown">;
              value: Array<NonNullable<ComponentInputs<TComponent>[key]>>;
              defaultValue: ComponentInputs<TComponent>[key];
          }
    ) & { description: string };
};

type ProcessedConfigItem<TValue = any> = {
    configType: ComponentConfigType;
    description: string;
    name: string; // From the input structure
    value: TValue; // Runtime JS type of the value
    valueType: "string" | "number" | "boolean" | "array" | "object" | "symbol" | "bigint" | "function" | "undefined";
};

/**
 * Transforms a ComponentConfigInputs object into an array of objects
 * with 'name', 'configType', 'valueType', and 'value' properties.
 *
 * @param configInput The ComponentConfigInputs object to process.
 * @returns An array of processed configuration objects, including runtime value type.
 * @template TComponent The component type used for ComponentConfigInputs.
 */
export function createComponentInputConfigArray<TComponent>(
    configInput: ComponentConfig<TComponent>
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
                configType: configItem.type, // Include the description from the input
                description: configItem.description, // Ensure key is treated as a string
                name: String(key), // 'single' or 'dropdown' from the input
                value: configItem.value, // The runtime JS type of the value
                valueType: runtimeValueType // The actual value or array of values
            });
        }
    }

    return processedArray;
}

// --- NEW: Helper type to extract the first item's type if it's an array ---
type ExtractFirstArrayItem<T> = T extends (infer U)[] ? U : T;

// --- Function to transform ComponentConfigInputs to a Record (Updated) ---

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

    for (const key in inputConfig) {
        if (Object.prototype.hasOwnProperty.call(inputConfig, key)) {
            const configItem = inputConfig[key];
            if (configItem) {
                let valueToAssign: any;
                // Check if the value is an array and has at least one element
                if (Array.isArray(configItem.value) && configItem.value.length > 0) {
                    if (configItem.type === "dropdown") {
                        valueToAssign = configItem.defaultValue;
                    } else {
                        valueToAssign = configItem.value[0]; // Take the first item
                    }
                } else if (Array.isArray(configItem.value) && configItem.value.length === 0) {
                    valueToAssign = null; // Or null, or a default empty value, depending on desired behavior for empty arrays
                } else {
                    valueToAssign = configItem.value; // Use the value as is for non-arrays
                }

                result[key as keyof ComponentInputs<TComponent>] = valueToAssign as ReturnType[typeof key];
            }
        }
    }

    return result;
}
