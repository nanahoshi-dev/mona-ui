import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    DropdownListAffixContainerStyleOverrides,
    DropdownListAffixContainerVariantsFunction,
    DropdownListInputStyleOverrides,
    DropdownListInputVariantProps,
    DropdownListInputVariantsFunction,
    DropdownListStyleOverrides,
    DropdownListValueContainerStyleOverrides,
    DropdownListValueContainerVariantProps,
    DropdownListValueContainerVariantsFunction
} from "./dropdown-list.types";

export function createDropdownListInputVariants(
    base: DropdownListInputVariantsFunction,
    overrides: readonly DropdownListStyleOverrides[],
    theme: ThemeStyle
): DropdownListInputVariantsFunction {
    const inputOverrides = activeOverrides(overrides, theme)
        .map(override => override.input)
        .filter((override): override is DropdownListInputStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: DropdownListInputVariantProps = {
            ...props,
            disabled: props.disabled ?? false,
            expanded: props.expanded ?? false,
            hasPrefix: props.hasPrefix ?? true,
            invalid: props.invalid ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of inputOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));
            classes.push(resolveVariantClass(override.expanded, resolvedProps.expanded));
            classes.push(resolveVariantClass(override.hasPrefix, resolvedProps.hasPrefix));
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

export function createDropdownListAffixContainerVariants(
    base: DropdownListAffixContainerVariantsFunction,
    overrides: readonly DropdownListStyleOverrides[],
    theme: ThemeStyle
): DropdownListAffixContainerVariantsFunction {
    const affixContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.affixContainer)
        .filter((override): override is DropdownListAffixContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of affixContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDropdownListValueContainerVariants(
    base: DropdownListValueContainerVariantsFunction,
    overrides: readonly DropdownListStyleOverrides[],
    theme: ThemeStyle
): DropdownListValueContainerVariantsFunction {
    const valueContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.valueContainer)
        .filter((override): override is DropdownListValueContainerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: DropdownListValueContainerVariantProps = {
            ...props,
            hasTemplate: props.hasTemplate ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of valueContainerOverrides) {
            classes.push(override.base);
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
    overrides: readonly DropdownListStyleOverrides[],
    theme: ThemeStyle
): readonly DropdownListStyleOverrides[] {
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
