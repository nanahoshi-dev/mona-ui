import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ColorPickerBaseStyleOverrides,
    ColorPickerBaseVariantProps,
    ColorPickerBaseVariantsFunction,
    ColorPickerColorStyleOverrides,
    ColorPickerColorVariantProps,
    ColorPickerColorVariantsFunction,
    ColorPickerStyleOverrides
} from "./color-picker.types";

export function createColorPickerBaseVariants(
    base: ColorPickerBaseVariantsFunction,
    overrides: readonly ColorPickerStyleOverrides[],
    theme: ThemeStyle
): ColorPickerBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ColorPickerBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ColorPickerBaseVariantProps = {
            ...props,
            expanded: props.expanded ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.expanded, resolvedProps.expanded));
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

export function createColorPickerColorVariants(
    base: ColorPickerColorVariantsFunction,
    overrides: readonly ColorPickerStyleOverrides[],
    theme: ThemeStyle
): ColorPickerColorVariantsFunction {
    const colorOverrides = activeOverrides(overrides, theme)
        .map(override => override.color)
        .filter((override): override is ColorPickerColorStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ColorPickerColorVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of colorOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly ColorPickerStyleOverrides[],
    theme: ThemeStyle
): readonly ColorPickerStyleOverrides[] {
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
