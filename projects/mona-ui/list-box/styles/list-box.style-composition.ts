import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ListBoxBaseStyleOverrides,
    ListBoxBaseVariantProps,
    ListBoxBaseVariantsFunction,
    ListBoxStyleOverrides,
    ListBoxToolbarStyleOverrides,
    ListBoxToolbarVariantProps,
    ListBoxToolbarVariantsFunction
} from "./list-box.types";

export function createListBoxBaseVariants(
    base: ListBoxBaseVariantsFunction,
    overrides: readonly ListBoxStyleOverrides[],
    theme: ThemeStyle
): ListBoxBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ListBoxBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ListBoxBaseVariantProps = {
            reversed: false,
            ...props
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.direction, resolvedProps.direction));
            classes.push(resolveVariantClass(override.reversed, resolvedProps.reversed));
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

export function createListBoxToolbarVariants(
    base: ListBoxToolbarVariantsFunction,
    overrides: readonly ListBoxStyleOverrides[],
    theme: ThemeStyle
): ListBoxToolbarVariantsFunction {
    const toolbarOverrides = activeOverrides(overrides, theme)
        .map(override => override.toolbar)
        .filter((override): override is ListBoxToolbarStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ListBoxToolbarVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of toolbarOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.direction, resolvedProps.direction));
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly ListBoxStyleOverrides[],
    theme: ThemeStyle
): readonly ListBoxStyleOverrides[] {
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
