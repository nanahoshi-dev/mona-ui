import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { ChipStyleOverrides, ChipVariantProps, ChipVariantsFunction } from "./chip.types";

export function createChipVariants(
    base: ChipVariantsFunction,
    overrides: readonly ChipStyleOverrides[],
    theme: ThemeStyle
): ChipVariantsFunction {
    return (props = {}) => {
        const activeOverrides = overrides.filter(override => override.theme === undefined || override.theme === theme);
        const resolvedProps = {
            ...props,
            look: props.look ?? "default",
            rounded: props.rounded ?? "full",
            size: props.size ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of activeOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));
            classes.push(resolveVariantClass(override.look, resolvedProps.look));
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));
            classes.push(resolveVariantClass(override.selected, resolvedProps.selected));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
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

function matchesCompoundVariant(expected: Partial<ChipVariantProps>, actual: Partial<ChipVariantProps>): boolean {
    return Object.entries(expected).every(([key, expectedValue]) => {
        const actualValue = actual[key as keyof ChipVariantProps];
        return actualValue === expectedValue;
    });
}
