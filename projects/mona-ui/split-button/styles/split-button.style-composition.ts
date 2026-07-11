import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { SplitButtonStyleOverrides, SplitButtonVariantProps, SplitButtonVariantsFunction } from "./split-button.types";

export function createSplitButtonVariants(
    base: SplitButtonVariantsFunction,
    overrides: readonly SplitButtonStyleOverrides[],
    theme: ThemeStyle
): SplitButtonVariantsFunction {
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
            classes.push(resolveVariantClass(override.look, resolvedProps.look));
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));
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
