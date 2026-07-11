import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ListViewBaseStyleOverrides,
    ListViewBaseVariantProps,
    ListViewBaseVariantsFunction,
    ListViewStyleOverrides
} from "./list-view.types";

export function createListViewBaseVariants(
    base: ListViewBaseVariantsFunction,
    overrides: readonly ListViewStyleOverrides[],
    theme: ThemeStyle
): ListViewBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ListViewBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ListViewBaseVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly ListViewStyleOverrides[],
    theme: ThemeStyle
): readonly ListViewStyleOverrides[] {
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
