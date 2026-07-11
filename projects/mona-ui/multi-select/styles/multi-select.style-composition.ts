import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    MultiSelectAffixContainerStyleOverrides,
    MultiSelectAffixContainerVariantsFunction,
    MultiSelectBaseStyleOverrides,
    MultiSelectBaseVariantProps,
    MultiSelectBaseVariantsFunction,
    MultiSelectIndicatorContainerStyleOverrides,
    MultiSelectIndicatorContainerVariantProps,
    MultiSelectIndicatorContainerVariantsFunction,
    MultiSelectItemContainerStyleOverrides,
    MultiSelectItemContainerVariantProps,
    MultiSelectItemContainerVariantsFunction,
    MultiSelectStyleOverrides
} from "./multi-select.types";

export function createMultiSelectBaseVariants(
    base: MultiSelectBaseVariantsFunction,
    overrides: readonly MultiSelectStyleOverrides[],
    theme: ThemeStyle
): MultiSelectBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is MultiSelectBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: MultiSelectBaseVariantProps = {
            ...props,
            disabled: props.disabled ?? false,
            focused: props.focused ?? false,
            invalid: props.invalid ?? false
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

export function createMultiSelectItemContainerVariants(
    base: MultiSelectItemContainerVariantsFunction,
    overrides: readonly MultiSelectStyleOverrides[],
    theme: ThemeStyle
): MultiSelectItemContainerVariantsFunction {
    const itemContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.itemContainer)
        .filter((override): override is MultiSelectItemContainerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: MultiSelectItemContainerVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of itemContainerOverrides) {
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

export function createMultiSelectAffixContainerVariants(
    base: MultiSelectAffixContainerVariantsFunction,
    overrides: readonly MultiSelectStyleOverrides[],
    theme: ThemeStyle
): MultiSelectAffixContainerVariantsFunction {
    const affixContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.affixContainer)
        .filter((override): override is MultiSelectAffixContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of affixContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createMultiSelectIndicatorContainerVariants(
    base: MultiSelectIndicatorContainerVariantsFunction,
    overrides: readonly MultiSelectStyleOverrides[],
    theme: ThemeStyle
): MultiSelectIndicatorContainerVariantsFunction {
    const indicatorContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.indicatorContainer)
        .filter((override): override is MultiSelectIndicatorContainerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: MultiSelectIndicatorContainerVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of indicatorContainerOverrides) {
            classes.push(override.base);
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
    overrides: readonly MultiSelectStyleOverrides[],
    theme: ThemeStyle
): readonly MultiSelectStyleOverrides[] {
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
