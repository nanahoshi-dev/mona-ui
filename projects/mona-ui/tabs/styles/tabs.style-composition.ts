import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    TabContentStyleOverrides,
    TabContentVariantProps,
    TabContentVariantsFunction,
    TabListBaseStyleOverrides,
    TabListBaseVariantProps,
    TabListBaseVariantsFunction,
    TabListListItemStyleOverrides,
    TabListListItemVariantProps,
    TabListListItemVariantsFunction,
    TabListListVariantsFunction,
    TabListListWrapperVariantsFunction,
    TabListScrollButtonVariantsFunction,
    TabsBaseVariantsFunction,
    TabsStyleOverrides
} from "./tabs.types";

export function createTabsBaseVariants(
    base: TabsBaseVariantsFunction,
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle
): TabsBaseVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.base);
}

export function createTabListListWrapperVariants(
    base: TabListListWrapperVariantsFunction,
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle
): TabListListWrapperVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.listWrapper);
}

export function createTabListListVariants(
    base: TabListListVariantsFunction,
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle
): TabListListVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.list);
}

export function createTabListScrollButtonVariants(
    base: TabListScrollButtonVariantsFunction,
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle
): TabListScrollButtonVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.scrollButton);
}

export function createTabListBaseVariants(
    base: TabListBaseVariantsFunction,
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle
): TabListBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.listBase)
        .filter((override): override is TabListBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: TabListBaseVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));
        }

        return twMerge(cx(...classes));
    };
}

export function createTabContentVariants(
    base: TabContentVariantsFunction,
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle
): TabContentVariantsFunction {
    const contentOverrides = activeOverrides(overrides, theme)
        .map(override => override.content)
        .filter((override): override is TabContentStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: TabContentVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of contentOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
        }

        return twMerge(cx(...classes));
    };
}

export function createTabListListItemVariants(
    base: TabListListItemVariantsFunction,
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle
): TabListListItemVariantsFunction {
    const listItemOverrides = activeOverrides(overrides, theme)
        .map(override => override.listItem)
        .filter((override): override is TabListListItemStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: TabListListItemVariantProps = {
            active: false,
            disabled: false,
            ...props
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of listItemOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.active, resolvedProps.active));
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));
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

function createStaticVariants<TStyleOverrides extends { readonly base?: ClassValue }>(
    base: () => string,
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle,
    select: (override: TabsStyleOverrides) => TStyleOverrides | undefined
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
    overrides: readonly TabsStyleOverrides[],
    theme: ThemeStyle
): readonly TabsStyleOverrides[] {
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
