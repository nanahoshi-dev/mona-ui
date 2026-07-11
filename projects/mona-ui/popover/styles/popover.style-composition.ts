import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    PopoverBaseStyleOverrides,
    PopoverBaseVariantProps,
    PopoverBaseVariantsFunction,
    PopoverContentStyleOverrides,
    PopoverContentVariantsFunction,
    PopoverHeaderStyleOverrides,
    PopoverHeaderVariantProps,
    PopoverHeaderVariantsFunction,
    PopoverStyleOverrides
} from "./popover.types";

export function createPopoverBaseVariants(
    base: PopoverBaseVariantsFunction,
    overrides: readonly PopoverStyleOverrides[],
    theme: ThemeStyle
): PopoverBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is PopoverBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: PopoverBaseVariantProps = { ...props, rounded: props.rounded ?? "medium" };
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

export function createPopoverHeaderVariants(
    base: PopoverHeaderVariantsFunction,
    overrides: readonly PopoverStyleOverrides[],
    theme: ThemeStyle
): PopoverHeaderVariantsFunction {
    const headerOverrides = activeOverrides(overrides, theme)
        .map(override => override.header)
        .filter((override): override is PopoverHeaderStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: PopoverHeaderVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of headerOverrides) {
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

export function createPopoverContentVariants(
    base: PopoverContentVariantsFunction,
    overrides: readonly PopoverStyleOverrides[],
    theme: ThemeStyle
): PopoverContentVariantsFunction {
    const contentOverrides = activeOverrides(overrides, theme)
        .map(override => override.content)
        .filter((override): override is PopoverContentStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of contentOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly PopoverStyleOverrides[],
    theme: ThemeStyle
): readonly PopoverStyleOverrides[] {
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
