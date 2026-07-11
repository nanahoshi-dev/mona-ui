import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    BreadcrumbCurrentItemStyleOverrides,
    BreadcrumbCurrentItemVariantsFunction,
    BreadcrumbListItemStyleOverrides,
    BreadcrumbListItemVariantProps,
    BreadcrumbListItemVariantsFunction,
    BreadcrumbListStyleOverrides,
    BreadcrumbListVariantProps,
    BreadcrumbListVariantsFunction,
    BreadcrumbStyleOverrides
} from "./breadcrumb.types";

export function createBreadcrumbListVariants(
    base: BreadcrumbListVariantsFunction,
    overrides: readonly BreadcrumbStyleOverrides[],
    theme: ThemeStyle
): BreadcrumbListVariantsFunction {
    const listOverrides = activeOverrides(overrides, theme)
        .map(override => override.list)
        .filter((override): override is BreadcrumbListStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps = { ...props, disabled: props.disabled ?? false };
        const classes: ClassValue[] = [base(props)];

        for (const override of listOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));
        }

        return twMerge(cx(...classes));
    };
}

export function createBreadcrumbListItemVariants(
    base: BreadcrumbListItemVariantsFunction,
    overrides: readonly BreadcrumbStyleOverrides[],
    theme: ThemeStyle
): BreadcrumbListItemVariantsFunction {
    const listItemOverrides = activeOverrides(overrides, theme)
        .map(override => override.listItem)
        .filter((override): override is BreadcrumbListItemStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: BreadcrumbListItemVariantProps = {
            ...props,
            disabled: props.disabled ?? false,
            listDisabled: props.listDisabled ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of listItemOverrides) {
            classes.push(override.base);
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

export function createBreadcrumbCurrentItemVariants(
    base: BreadcrumbCurrentItemVariantsFunction,
    overrides: readonly BreadcrumbStyleOverrides[],
    theme: ThemeStyle
): BreadcrumbCurrentItemVariantsFunction {
    const currentItemOverrides = activeOverrides(overrides, theme)
        .map(override => override.currentItem)
        .filter((override): override is BreadcrumbCurrentItemStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of currentItemOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly BreadcrumbStyleOverrides[],
    theme: ThemeStyle
): readonly BreadcrumbStyleOverrides[] {
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
