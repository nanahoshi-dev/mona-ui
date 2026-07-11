import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ComboBoxAffixContainerStyleOverrides,
    ComboBoxAffixContainerVariantsFunction,
    ComboBoxBaseStyleOverrides,
    ComboBoxBaseVariantProps,
    ComboBoxBaseVariantsFunction,
    ComboBoxStyleOverrides,
    ComboBoxTextInputStyleOverrides,
    ComboBoxTextInputVariantProps,
    ComboBoxTextInputVariantsFunction
} from "./combo-box.types";

export function createComboBoxBaseVariants(
    base: ComboBoxBaseVariantsFunction,
    overrides: readonly ComboBoxStyleOverrides[],
    theme: ThemeStyle
): ComboBoxBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ComboBoxBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ComboBoxBaseVariantProps = {
            ...props,
            disabled: props.disabled ?? false,
            focused: props.focused ?? false,
            invalid: props.invalid ?? false,
            rounded: props.rounded ?? "medium",
            size: props.size ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));
            classes.push(resolveVariantClass(override.focused, resolvedProps.focused));
            classes.push(resolveVariantClass(override.invalid, resolvedProps.invalid));
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createComboBoxTextInputVariants(
    base: ComboBoxTextInputVariantsFunction,
    overrides: readonly ComboBoxStyleOverrides[],
    theme: ThemeStyle
): ComboBoxTextInputVariantsFunction {
    const textInputOverrides = activeOverrides(overrides, theme)
        .map(override => override.textInput)
        .filter((override): override is ComboBoxTextInputStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ComboBoxTextInputVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of textInputOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createComboBoxAffixContainerVariants(
    base: ComboBoxAffixContainerVariantsFunction,
    overrides: readonly ComboBoxStyleOverrides[],
    theme: ThemeStyle
): ComboBoxAffixContainerVariantsFunction {
    const affixContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.affixContainer)
        .filter((override): override is ComboBoxAffixContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of affixContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly ComboBoxStyleOverrides[],
    theme: ThemeStyle
): readonly ComboBoxStyleOverrides[] {
    return overrides.filter(override => override.theme === undefined || override.theme === theme);
}

function resolveVariantClass(
    classes: Partial<Record<string, ClassValue>> | undefined,
    value: unknown
): ClassValue | undefined {
    if (classes === undefined || value === null || value === undefined) {
        return undefined;
    }

    return classes[String(value)];
}

function matchesCompoundVariant<T extends Record<string, unknown>>(expected: Partial<T>, actual: T): boolean {
    return Object.entries(expected).every(([key, expectedValue]) => actual[key as keyof T] === expectedValue);
}
