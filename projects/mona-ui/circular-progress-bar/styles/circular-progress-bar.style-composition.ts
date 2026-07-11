import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    CircularProgressBarBaseStyleOverrides,
    CircularProgressBarBaseVariantProps,
    CircularProgressBarBaseVariantsFunction,
    CircularProgressBarStyleOverrides
} from "./circular-progress-bar.types";

export function createCircularProgressBarBaseVariants(
    base: CircularProgressBarBaseVariantsFunction,
    overrides: readonly CircularProgressBarStyleOverrides[],
    theme: ThemeStyle
): CircularProgressBarBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is CircularProgressBarBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: CircularProgressBarBaseVariantProps = { ...props, disabled: props.disabled ?? false };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
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

function activeOverrides(
    overrides: readonly CircularProgressBarStyleOverrides[],
    theme: ThemeStyle
): readonly CircularProgressBarStyleOverrides[] {
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
