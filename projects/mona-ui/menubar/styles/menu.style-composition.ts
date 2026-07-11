import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    MenubarBaseStyleOverrides,
    MenubarBaseVariantProps,
    MenubarBaseVariantsFunction,
    MenubarListItemStyleOverrides,
    MenubarListItemVariantProps,
    MenubarListItemVariantsFunction,
    MenubarListVariantsFunction,
    MenubarStyleOverrides
} from "./menu.types";

export function createMenubarBaseVariants(
    base: MenubarBaseVariantsFunction,
    overrides: readonly MenubarStyleOverrides[],
    theme: ThemeStyle
): MenubarBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is MenubarBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: MenubarBaseVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));
        }

        return twMerge(cx(...classes));
    };
}

export function createMenubarListVariants(
    base: MenubarListVariantsFunction,
    overrides: readonly MenubarStyleOverrides[],
    theme: ThemeStyle
): MenubarListVariantsFunction {
    const listOverrides = activeOverrides(overrides, theme)
        .map(override => override.list)
        .filter((override): override is NonNullable<MenubarStyleOverrides["list"]> => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of listOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createMenubarListItemVariants(
    base: MenubarListItemVariantsFunction,
    overrides: readonly MenubarStyleOverrides[],
    theme: ThemeStyle
): MenubarListItemVariantsFunction {
    const listItemOverrides = activeOverrides(overrides, theme)
        .map(override => override.listItem)
        .filter((override): override is MenubarListItemStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: MenubarListItemVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of listItemOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly MenubarStyleOverrides[],
    theme: ThemeStyle
): readonly MenubarStyleOverrides[] {
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
