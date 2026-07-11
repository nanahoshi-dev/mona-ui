import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ScrollViewArrowStyleOverrides,
    ScrollViewArrowVariantProps,
    ScrollViewArrowVariantsFunction,
    ScrollViewBaseStyleOverrides,
    ScrollViewBaseVariantProps,
    ScrollViewBaseVariantsFunction,
    ScrollViewContentStyleOverrides,
    ScrollViewContentVariantsFunction,
    ScrollViewListStyleOverrides,
    ScrollViewListVariantsFunction,
    ScrollViewPagerArrowStyleOverrides,
    ScrollViewPagerArrowVariantsFunction,
    ScrollViewPagerListContainerStyleOverrides,
    ScrollViewPagerListContainerVariantsFunction,
    ScrollViewPagerListItemStyleOverrides,
    ScrollViewPagerListItemVariantProps,
    ScrollViewPagerListItemVariantsFunction,
    ScrollViewPagerListStyleOverrides,
    ScrollViewPagerListVariantsFunction,
    ScrollViewPagerStyleOverrides,
    ScrollViewPagerVariantProps,
    ScrollViewPagerVariantsFunction,
    ScrollViewStyleOverrides
} from "./scroll-view.types";

export function createScrollViewBaseVariants(
    base: ScrollViewBaseVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ScrollViewBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ScrollViewBaseVariantProps = { ...props, rounded: props.rounded ?? "medium" };
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

export function createScrollViewContentVariants(
    base: ScrollViewContentVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewContentVariantsFunction {
    const contentOverrides = activeOverrides(overrides, theme)
        .map(override => override.content)
        .filter((override): override is ScrollViewContentStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of contentOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createScrollViewListVariants(
    base: ScrollViewListVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewListVariantsFunction {
    const listOverrides = activeOverrides(overrides, theme)
        .map(override => override.list)
        .filter((override): override is ScrollViewListStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of listOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createScrollViewArrowVariants(
    base: ScrollViewArrowVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewArrowVariantsFunction {
    const arrowOverrides = activeOverrides(overrides, theme)
        .map(override => override.arrow)
        .filter((override): override is ScrollViewArrowStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ScrollViewArrowVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of arrowOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.hidden, resolvedProps.hidden));
            classes.push(resolveVariantClass(override.left, resolvedProps.left));
            classes.push(resolveVariantClass(override.right, resolvedProps.right));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createScrollViewPagerVariants(
    base: ScrollViewPagerVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewPagerVariantsFunction {
    const pagerOverrides = activeOverrides(overrides, theme)
        .map(override => override.pager)
        .filter((override): override is ScrollViewPagerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ScrollViewPagerVariantProps = { ...props, pagerOverlay: props.pagerOverlay ?? "dark" };
        const classes: ClassValue[] = [base(props)];

        for (const override of pagerOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.pagerOverlay, resolvedProps.pagerOverlay));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createScrollViewPagerListContainerVariants(
    base: ScrollViewPagerListContainerVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewPagerListContainerVariantsFunction {
    const pagerListContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.pagerListContainer)
        .filter((override): override is ScrollViewPagerListContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of pagerListContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createScrollViewPagerListVariants(
    base: ScrollViewPagerListVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewPagerListVariantsFunction {
    const pagerListOverrides = activeOverrides(overrides, theme)
        .map(override => override.pagerList)
        .filter((override): override is ScrollViewPagerListStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of pagerListOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createScrollViewPagerListItemVariants(
    base: ScrollViewPagerListItemVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewPagerListItemVariantsFunction {
    const pagerListItemOverrides = activeOverrides(overrides, theme)
        .map(override => override.pagerListItem)
        .filter((override): override is ScrollViewPagerListItemStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ScrollViewPagerListItemVariantProps = {
            ...props,
            pagerRounded: props.pagerRounded ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of pagerListItemOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.active, resolvedProps.active));
            classes.push(resolveVariantClass(override.pagerRounded, resolvedProps.pagerRounded));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createScrollViewPagerArrowVariants(
    base: ScrollViewPagerArrowVariantsFunction,
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): ScrollViewPagerArrowVariantsFunction {
    const pagerArrowOverrides = activeOverrides(overrides, theme)
        .map(override => override.pagerArrow)
        .filter((override): override is ScrollViewPagerArrowStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of pagerArrowOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly ScrollViewStyleOverrides[],
    theme: ThemeStyle
): readonly ScrollViewStyleOverrides[] {
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
