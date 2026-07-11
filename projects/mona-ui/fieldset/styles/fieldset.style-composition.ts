import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    FieldsetBaseStyleOverrides,
    FieldsetBaseVariantsFunction,
    FieldsetFieldsetStyleOverrides,
    FieldsetFieldsetVariantProps,
    FieldsetFieldsetVariantsFunction,
    FieldsetLegendStyleOverrides,
    FieldsetLegendVariantProps,
    FieldsetLegendVariantsFunction,
    FieldsetStyleOverrides
} from "./fieldset.types";

export function createFieldsetBaseVariants(
    base: FieldsetBaseVariantsFunction,
    overrides: readonly FieldsetStyleOverrides[],
    theme: ThemeStyle
): FieldsetBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is FieldsetBaseStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of baseOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createFieldsetFieldsetVariants(
    base: FieldsetFieldsetVariantsFunction,
    overrides: readonly FieldsetStyleOverrides[],
    theme: ThemeStyle
): FieldsetFieldsetVariantsFunction {
    const fieldsetOverrides = activeOverrides(overrides, theme)
        .map(override => override.fieldset)
        .filter((override): override is FieldsetFieldsetStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: FieldsetFieldsetVariantProps = {
            ...props,
            rounded: props.rounded ?? "medium",
            disabled: props.disabled ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of fieldsetOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createFieldsetLegendVariants(
    base: FieldsetLegendVariantsFunction,
    overrides: readonly FieldsetStyleOverrides[],
    theme: ThemeStyle
): FieldsetLegendVariantsFunction {
    const legendOverrides = activeOverrides(overrides, theme)
        .map(override => override.legend)
        .filter((override): override is FieldsetLegendStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: FieldsetLegendVariantProps = {
            ...props,
            rounded: props.rounded ?? "medium",
            hasTemplate: props.hasTemplate ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of legendOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.hasTemplate, resolvedProps.hasTemplate));

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
    overrides: readonly FieldsetStyleOverrides[],
    theme: ThemeStyle
): readonly FieldsetStyleOverrides[] {
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
