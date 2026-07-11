import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    TooltipArrowStyleOverrides,
    TooltipArrowVariantsFunction,
    TooltipBaseStyleOverrides,
    TooltipBaseVariantProps,
    TooltipBaseVariantsFunction,
    TooltipStyleOverrides
} from "./tooltip.types";

export function createTooltipBaseVariants(
    base: TooltipBaseVariantsFunction,
    overrides: readonly TooltipStyleOverrides[],
    theme: ThemeStyle
): TooltipBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is TooltipBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: TooltipBaseVariantProps = { ...props, rounded: props.rounded ?? "medium" };
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

export function createTooltipArrowVariants(
    base: TooltipArrowVariantsFunction,
    overrides: readonly TooltipStyleOverrides[],
    theme: ThemeStyle
): TooltipArrowVariantsFunction {
    const arrowOverrides = activeOverrides(overrides, theme)
        .map(override => override.arrow)
        .filter((override): override is TooltipArrowStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of arrowOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly TooltipStyleOverrides[],
    theme: ThemeStyle
): readonly TooltipStyleOverrides[] {
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
