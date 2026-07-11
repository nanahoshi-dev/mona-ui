import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ProgressBarBaseStyleOverrides,
    ProgressBarBaseVariantProps,
    ProgressBarBaseVariantsFunction,
    ProgressBarIndeterminateStyleOverrides,
    ProgressBarIndeterminateVariantsFunction,
    ProgressBarLabelStyleOverrides,
    ProgressBarLabelVariantsFunction,
    ProgressBarStyleOverrides,
    ProgressBarTrackStyleOverrides,
    ProgressBarTrackVariantProps,
    ProgressBarTrackVariantsFunction
} from "./progress-bar.types";

export function createProgressBarBaseVariants(
    base: ProgressBarBaseVariantsFunction,
    overrides: readonly ProgressBarStyleOverrides[],
    theme: ThemeStyle
): ProgressBarBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ProgressBarBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ProgressBarBaseVariantProps = { ...props, rounded: props.rounded ?? "medium" };
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

export function createProgressBarIndeterminateVariants(
    base: ProgressBarIndeterminateVariantsFunction,
    overrides: readonly ProgressBarStyleOverrides[],
    theme: ThemeStyle
): ProgressBarIndeterminateVariantsFunction {
    const indeterminateOverrides = activeOverrides(overrides, theme)
        .map(override => override.indeterminate)
        .filter((override): override is ProgressBarIndeterminateStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of indeterminateOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createProgressBarLabelVariants(
    base: ProgressBarLabelVariantsFunction,
    overrides: readonly ProgressBarStyleOverrides[],
    theme: ThemeStyle
): ProgressBarLabelVariantsFunction {
    const labelOverrides = activeOverrides(overrides, theme)
        .map(override => override.label)
        .filter((override): override is ProgressBarLabelStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of labelOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createProgressBarTrackVariants(
    base: ProgressBarTrackVariantsFunction,
    overrides: readonly ProgressBarStyleOverrides[],
    theme: ThemeStyle
): ProgressBarTrackVariantsFunction {
    const trackOverrides = activeOverrides(overrides, theme)
        .map(override => override.track)
        .filter((override): override is ProgressBarTrackStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ProgressBarTrackVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of trackOverrides) {
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

function activeOverrides(
    overrides: readonly ProgressBarStyleOverrides[],
    theme: ThemeStyle
): readonly ProgressBarStyleOverrides[] {
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
