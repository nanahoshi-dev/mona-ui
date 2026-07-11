import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    DateTimePickerBaseStyleOverrides,
    DateTimePickerBaseVariantProps,
    DateTimePickerBaseVariantsFunction,
    DateTimePickerFooterStyleOverrides,
    DateTimePickerFooterVariantsFunction,
    DateTimePickerHeaderStyleOverrides,
    DateTimePickerHeaderVariantsFunction,
    DateTimePickerStyleOverrides
} from "./datetime-picker.types";

export function createDateTimePickerBaseVariants(
    base: DateTimePickerBaseVariantsFunction,
    overrides: readonly DateTimePickerStyleOverrides[],
    theme: ThemeStyle
): DateTimePickerBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is DateTimePickerBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: DateTimePickerBaseVariantProps = {
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

export function createDateTimePickerHeaderVariants(
    base: DateTimePickerHeaderVariantsFunction,
    overrides: readonly DateTimePickerStyleOverrides[],
    theme: ThemeStyle
): DateTimePickerHeaderVariantsFunction {
    const headerOverrides = activeOverrides(overrides, theme)
        .map(override => override.header)
        .filter((override): override is DateTimePickerHeaderStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of headerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDateTimePickerFooterVariants(
    base: DateTimePickerFooterVariantsFunction,
    overrides: readonly DateTimePickerStyleOverrides[],
    theme: ThemeStyle
): DateTimePickerFooterVariantsFunction {
    const footerOverrides = activeOverrides(overrides, theme)
        .map(override => override.footer)
        .filter((override): override is DateTimePickerFooterStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of footerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly DateTimePickerStyleOverrides[],
    theme: ThemeStyle
): readonly DateTimePickerStyleOverrides[] {
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
