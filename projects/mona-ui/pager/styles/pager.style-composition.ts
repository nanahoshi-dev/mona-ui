import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    PagerBaseStyleOverrides,
    PagerBaseVariantProps,
    PagerBaseVariantsFunction,
    PagerInfoVariantsFunction,
    PagerInputVariantsFunction,
    PagerListItemStyleOverrides,
    PagerListItemVariantProps,
    PagerListItemVariantsFunction,
    PagerListVariantsFunction,
    PagerStyleOverrides
} from "./pager.types";

export function createPagerBaseVariants(
    base: PagerBaseVariantsFunction,
    overrides: readonly PagerStyleOverrides[],
    theme: ThemeStyle
): PagerBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is PagerBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: PagerBaseVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));
        }

        return twMerge(cx(...classes));
    };
}

export function createPagerInfoVariants(
    base: PagerInfoVariantsFunction,
    overrides: readonly PagerStyleOverrides[],
    theme: ThemeStyle
): PagerInfoVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.info);
}

export function createPagerInputVariants(
    base: PagerInputVariantsFunction,
    overrides: readonly PagerStyleOverrides[],
    theme: ThemeStyle
): PagerInputVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.input);
}

export function createPagerListVariants(
    base: PagerListVariantsFunction,
    overrides: readonly PagerStyleOverrides[],
    theme: ThemeStyle
): PagerListVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.list);
}

export function createPagerListItemVariants(
    base: PagerListItemVariantsFunction,
    overrides: readonly PagerStyleOverrides[],
    theme: ThemeStyle
): PagerListItemVariantsFunction {
    const listItemOverrides = activeOverrides(overrides, theme)
        .map(override => override.listItem)
        .filter((override): override is PagerListItemStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: PagerListItemVariantProps = { active: false, ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of listItemOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.active, resolvedProps.active));
        }

        return twMerge(cx(...classes));
    };
}

function createStaticVariants<TStyleOverrides extends { readonly base?: ClassValue }>(
    base: () => string,
    overrides: readonly PagerStyleOverrides[],
    theme: ThemeStyle,
    select: (override: PagerStyleOverrides) => TStyleOverrides | undefined
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
    overrides: readonly PagerStyleOverrides[],
    theme: ThemeStyle
): readonly PagerStyleOverrides[] {
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
