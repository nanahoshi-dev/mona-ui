import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ListGroupHeaderStyleOverrides,
    ListGroupHeaderTextStyleOverrides,
    ListGroupHeaderTextVariantsFunction,
    ListGroupHeaderVariantsFunction,
    ListInnerListStyleOverrides,
    ListInnerListVariantsFunction,
    ListItemBaseStyleOverrides,
    ListItemBaseVariantsFunction,
    ListItemContentStyleOverrides,
    ListItemContentVariantProps,
    ListItemContentVariantsFunction,
    ListStyleOverrides,
    ListStylesOverrides,
    ListVariantsFunction
} from "./list.types";

export function createListVariants(
    base: ListVariantsFunction,
    overrides: readonly ListStylesOverrides[],
    theme: ThemeStyle
): ListVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.list);
}

export function createListInnerListVariants(
    base: ListInnerListVariantsFunction,
    overrides: readonly ListStylesOverrides[],
    theme: ThemeStyle
): ListInnerListVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.innerList);
}

export function createListItemBaseVariants(
    base: ListItemBaseVariantsFunction,
    overrides: readonly ListStylesOverrides[],
    theme: ThemeStyle
): ListItemBaseVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.itemBase);
}

export function createListGroupHeaderVariants(
    base: ListGroupHeaderVariantsFunction,
    overrides: readonly ListStylesOverrides[],
    theme: ThemeStyle
): ListGroupHeaderVariantsFunction {
    const groupHeaderOverrides = activeOverrides(overrides, theme)
        .map(override => override.groupHeader)
        .filter((override): override is ListGroupHeaderStyleOverrides => override !== undefined);

    return (props = {}) => {
        const classes: ClassValue[] = [base(props)];

        for (const override of groupHeaderOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.hasTemplate, props.hasTemplate ?? false));
        }

        return twMerge(cx(...classes));
    };
}

export function createListGroupHeaderTextVariants(
    base: ListGroupHeaderTextVariantsFunction,
    overrides: readonly ListStylesOverrides[],
    theme: ThemeStyle
): ListGroupHeaderTextVariantsFunction {
    const groupHeaderTextOverrides = activeOverrides(overrides, theme)
        .map(override => override.groupHeaderText)
        .filter((override): override is ListGroupHeaderTextStyleOverrides => override !== undefined);

    return (props = {}) => {
        const classes: ClassValue[] = [base(props)];

        for (const override of groupHeaderTextOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.hasTemplate, props.hasTemplate ?? false));
        }

        return twMerge(cx(...classes));
    };
}

export function createListItemContentVariants(
    base: ListItemContentVariantsFunction,
    overrides: readonly ListStylesOverrides[],
    theme: ThemeStyle
): ListItemContentVariantsFunction {
    const itemContentOverrides = activeOverrides(overrides, theme)
        .map(override => override.itemContent)
        .filter((override): override is ListItemContentStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ListItemContentVariantProps = {
            checkboxes: false,
            highlighted: false,
            selected: false,
            disabled: false,
            ...props
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of itemContentOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.checkboxes, resolvedProps.checkboxes));
            classes.push(resolveVariantClass(override.highlighted, resolvedProps.highlighted));
            classes.push(resolveVariantClass(override.selected, resolvedProps.selected));
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

function createStaticVariants<TStyleOverrides extends { readonly base?: ClassValue }>(
    base: () => string,
    overrides: readonly ListStylesOverrides[],
    theme: ThemeStyle,
    select: (override: ListStylesOverrides) => TStyleOverrides | undefined
): () => string {
    const staticOverrides = activeOverrides(overrides, theme)
        .map(select)
        .filter((override): override is TStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of staticOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly ListStylesOverrides[],
    theme: ThemeStyle
): readonly ListStylesOverrides[] {
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
