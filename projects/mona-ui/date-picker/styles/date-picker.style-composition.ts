import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    DatePickerBaseStyleOverrides,
    DatePickerBaseVariantProps,
    DatePickerBaseVariantsFunction,
    DatePickerStyleOverrides
} from "./date-picker.types";

export function createDatePickerBaseVariants(
    base: DatePickerBaseVariantsFunction,
    overrides: readonly DatePickerStyleOverrides[],
    theme: ThemeStyle
): DatePickerBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is DatePickerBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: DatePickerBaseVariantProps = {
            ...props,
            focused: props.focused ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.focused, resolvedProps.focused));
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

function activeOverrides(
    overrides: readonly DatePickerStyleOverrides[],
    theme: ThemeStyle
): readonly DatePickerStyleOverrides[] {
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
