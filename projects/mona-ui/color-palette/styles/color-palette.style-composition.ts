import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ColorPaletteBaseStyleOverrides,
    ColorPaletteBaseVariantsFunction,
    ColorPaletteItemStyleOverrides,
    ColorPaletteItemVariantProps,
    ColorPaletteItemVariantsFunction,
    ColorPaletteStyleOverrides
} from "./color-palette.types";

export function createColorPaletteBaseVariants(
    base: ColorPaletteBaseVariantsFunction,
    overrides: readonly ColorPaletteStyleOverrides[],
    theme: ThemeStyle
): ColorPaletteBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ColorPaletteBaseStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of baseOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createColorPaletteItemVariants(
    base: ColorPaletteItemVariantsFunction,
    overrides: readonly ColorPaletteStyleOverrides[],
    theme: ThemeStyle
): ColorPaletteItemVariantsFunction {
    const itemOverrides = activeOverrides(overrides, theme)
        .map(override => override.item)
        .filter((override): override is ColorPaletteItemStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ColorPaletteItemVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of itemOverrides) {
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
    overrides: readonly ColorPaletteStyleOverrides[],
    theme: ThemeStyle
): readonly ColorPaletteStyleOverrides[] {
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
