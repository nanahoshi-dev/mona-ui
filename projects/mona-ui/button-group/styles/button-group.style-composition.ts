import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { ButtonGroupStyleOverrides, ButtonGroupVariantProps, ButtonGroupVariantsFunction } from "./button-group.types";

export function createButtonGroupVariants(
    base: ButtonGroupVariantsFunction,
    overrides: readonly ButtonGroupStyleOverrides[],
    theme: ThemeStyle
): ButtonGroupVariantsFunction {
    return (props = {}) => {
        const activeOverrides = overrides.filter(override => override.theme === undefined || override.theme === theme);
        const resolvedProps = {
            ...props,
            look: props.look ?? "default",
            size: props.size ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of activeOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.look, resolvedProps.look));
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));

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

function matchesCompoundVariant(
    expected: Partial<ButtonGroupVariantProps>,
    actual: Partial<ButtonGroupVariantProps>
): boolean {
    return Object.entries(expected).every(([key, expectedValue]) => {
        const actualValue = actual[key as keyof ButtonGroupVariantProps];
        return actualValue === expectedValue;
    });
}
