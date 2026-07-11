import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ExpansionPanelBaseStyleOverrides,
    ExpansionPanelBaseVariantProps,
    ExpansionPanelBaseVariantsFunction,
    ExpansionPanelContentStyleOverrides,
    ExpansionPanelContentVariantProps,
    ExpansionPanelContentVariantsFunction,
    ExpansionPanelHeaderStyleOverrides,
    ExpansionPanelHeaderTitleStyleOverrides,
    ExpansionPanelHeaderTitleVariantsFunction,
    ExpansionPanelHeaderVariantProps,
    ExpansionPanelHeaderVariantsFunction,
    ExpansionPanelIconContainerStyleOverrides,
    ExpansionPanelIconContainerVariantProps,
    ExpansionPanelIconContainerVariantsFunction,
    ExpansionPanelStyleOverrides
} from "./expansion-panel.types";

export function createExpansionPanelBaseVariants(
    base: ExpansionPanelBaseVariantsFunction,
    overrides: readonly ExpansionPanelStyleOverrides[],
    theme: ThemeStyle
): ExpansionPanelBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ExpansionPanelBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ExpansionPanelBaseVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
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

export function createExpansionPanelHeaderVariants(
    base: ExpansionPanelHeaderVariantsFunction,
    overrides: readonly ExpansionPanelStyleOverrides[],
    theme: ThemeStyle
): ExpansionPanelHeaderVariantsFunction {
    const headerOverrides = activeOverrides(overrides, theme)
        .map(override => override.header)
        .filter((override): override is ExpansionPanelHeaderStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ExpansionPanelHeaderVariantProps = {
            ...props,
            collapsed: props.collapsed ?? false,
            disabled: props.disabled ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of headerOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.collapsed, resolvedProps.collapsed));
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

export function createExpansionPanelHeaderTitleVariants(
    base: ExpansionPanelHeaderTitleVariantsFunction,
    overrides: readonly ExpansionPanelStyleOverrides[],
    theme: ThemeStyle
): ExpansionPanelHeaderTitleVariantsFunction {
    const headerTitleOverrides = activeOverrides(overrides, theme)
        .map(override => override.headerTitle)
        .filter((override): override is ExpansionPanelHeaderTitleStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of headerTitleOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createExpansionPanelIconContainerVariants(
    base: ExpansionPanelIconContainerVariantsFunction,
    overrides: readonly ExpansionPanelStyleOverrides[],
    theme: ThemeStyle
): ExpansionPanelIconContainerVariantsFunction {
    const iconContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.iconContainer)
        .filter((override): override is ExpansionPanelIconContainerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ExpansionPanelIconContainerVariantProps = {
            ...props,
            hasTemplate: props.hasTemplate ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of iconContainerOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.hasTemplate, resolvedProps.hasTemplate));
        }

        return twMerge(cx(...classes));
    };
}

export function createExpansionPanelContentVariants(
    base: ExpansionPanelContentVariantsFunction,
    overrides: readonly ExpansionPanelStyleOverrides[],
    theme: ThemeStyle
): ExpansionPanelContentVariantsFunction {
    const contentOverrides = activeOverrides(overrides, theme)
        .map(override => override.content)
        .filter((override): override is ExpansionPanelContentStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ExpansionPanelContentVariantProps = { ...props, expanded: props.expanded ?? false };
        const classes: ClassValue[] = [base(props)];

        for (const override of contentOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.expanded, resolvedProps.expanded));

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
    overrides: readonly ExpansionPanelStyleOverrides[],
    theme: ThemeStyle
): readonly ExpansionPanelStyleOverrides[] {
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
