import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { ButtonStyleOverrides, ButtonVariantProps, ButtonVariantsFunction } from "./button.types";

export function createButtonVariants(
    base: ButtonVariantsFunction,
    overrides: readonly ButtonStyleOverrides[],
    theme: ThemeStyle
): ButtonVariantsFunction {
    return (props = {}) => {
        const activeOverrides = overrides.filter(override => override.theme === undefined || override.theme === theme);
        const resolvedProps = {
            ...props,
            look: props.look ?? "default",
            rounded: props.rounded ?? "medium",
            size: props.size ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of activeOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));
            classes.push(resolveVariantClass(override.iconOnly, resolvedProps.iconOnly));
            classes.push(resolveVariantClass(override.loading, resolvedProps.loading));
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

function matchesCompoundVariant(expected: Partial<ButtonVariantProps>, actual: Partial<ButtonVariantProps>): boolean {
    return Object.entries(expected).every(([key, expectedValue]) => {
        const actualValue = actual[key as keyof ButtonVariantProps];
        return actualValue === expectedValue;
    });
}
