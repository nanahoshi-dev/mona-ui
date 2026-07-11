import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    TimeSelectorBaseStyleOverrides,
    TimeSelectorBaseVariantProps,
    TimeSelectorBaseVariantsFunction,
    TimeSelectorFooterStyleOverrides,
    TimeSelectorFooterVariantsFunction,
    TimeSelectorHeaderStyleOverrides,
    TimeSelectorHeaderVariantsFunction,
    TimeSelectorInfoContainerStyleOverrides,
    TimeSelectorInfoContainerVariantsFunction,
    TimeSelectorListContainerStyleOverrides,
    TimeSelectorListContainerVariantsFunction,
    TimeSelectorListItemStyleOverrides,
    TimeSelectorListItemVariantProps,
    TimeSelectorListItemVariantsFunction,
    TimeSelectorListStyleOverrides,
    TimeSelectorListVariantProps,
    TimeSelectorListVariantsFunction,
    TimeSelectorStyleOverrides
} from "./time-selector.types";

export function createTimeSelectorBaseVariants(
    base: TimeSelectorBaseVariantsFunction,
    overrides: readonly TimeSelectorStyleOverrides[],
    theme: ThemeStyle
): TimeSelectorBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is TimeSelectorBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: TimeSelectorBaseVariantProps = {
            ...props,
            disabled: props.disabled ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));
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

export function createTimeSelectorFooterVariants(
    base: TimeSelectorFooterVariantsFunction,
    overrides: readonly TimeSelectorStyleOverrides[],
    theme: ThemeStyle
): TimeSelectorFooterVariantsFunction {
    const footerOverrides = activeOverrides(overrides, theme)
        .map(override => override.footer)
        .filter((override): override is TimeSelectorFooterStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of footerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createTimeSelectorHeaderVariants(
    base: TimeSelectorHeaderVariantsFunction,
    overrides: readonly TimeSelectorStyleOverrides[],
    theme: ThemeStyle
): TimeSelectorHeaderVariantsFunction {
    const headerOverrides = activeOverrides(overrides, theme)
        .map(override => override.header)
        .filter((override): override is TimeSelectorHeaderStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of headerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createTimeSelectorInfoContainerVariants(
    base: TimeSelectorInfoContainerVariantsFunction,
    overrides: readonly TimeSelectorStyleOverrides[],
    theme: ThemeStyle
): TimeSelectorInfoContainerVariantsFunction {
    const infoContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.infoContainer)
        .filter((override): override is TimeSelectorInfoContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of infoContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createTimeSelectorListContainerVariants(
    base: TimeSelectorListContainerVariantsFunction,
    overrides: readonly TimeSelectorStyleOverrides[],
    theme: ThemeStyle
): TimeSelectorListContainerVariantsFunction {
    const listContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.listContainer)
        .filter((override): override is TimeSelectorListContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of listContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createTimeSelectorListVariants(
    base: TimeSelectorListVariantsFunction,
    overrides: readonly TimeSelectorStyleOverrides[],
    theme: ThemeStyle
): TimeSelectorListVariantsFunction {
    const listOverrides = activeOverrides(overrides, theme)
        .map(override => override.list)
        .filter((override): override is TimeSelectorListStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: TimeSelectorListVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of listOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.size, resolvedProps.size));
        }

        return twMerge(cx(...classes));
    };
}

export function createTimeSelectorListItemVariants(
    base: TimeSelectorListItemVariantsFunction,
    overrides: readonly TimeSelectorStyleOverrides[],
    theme: ThemeStyle
): TimeSelectorListItemVariantsFunction {
    const listItemOverrides = activeOverrides(overrides, theme)
        .map(override => override.listItem)
        .filter((override): override is TimeSelectorListItemStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: TimeSelectorListItemVariantProps = {
            ...props,
            selected: props.selected ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of listItemOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.selected, resolvedProps.selected));
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
    overrides: readonly TimeSelectorStyleOverrides[],
    theme: ThemeStyle
): readonly TimeSelectorStyleOverrides[] {
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
