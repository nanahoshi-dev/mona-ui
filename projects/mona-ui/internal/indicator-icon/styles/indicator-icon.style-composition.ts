import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    IndicatorIconHostVariantProps,
    IndicatorIconHostVariantsFunction,
    IndicatorIconStyleOverrides,
    IndicatorIconSvgVariantProps,
    IndicatorIconSvgVariantsFunction
} from "./indicator-icon.types";

export function createIndicatorIconHostVariants(
    base: IndicatorIconHostVariantsFunction,
    overrides: readonly IndicatorIconStyleOverrides[],
    theme: ThemeStyle
): IndicatorIconHostVariantsFunction {
    const hostOverrides = activeOverrides(overrides, theme)
        .map(override => override.host)
        .filter((override): override is NonNullable<IndicatorIconStyleOverrides["host"]> => override !== undefined);

    return (props = {}) => {
        const resolvedProps: IndicatorIconHostVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of hostOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.interactive, resolvedProps.interactive));
            classes.push(resolveVariantClass(override.preset, resolvedProps.preset));
        }

        return twMerge(cx(...classes));
    };
}

export function createIndicatorIconSvgVariants(
    base: IndicatorIconSvgVariantsFunction,
    overrides: readonly IndicatorIconStyleOverrides[],
    theme: ThemeStyle
): IndicatorIconSvgVariantsFunction {
    const svgOverrides = activeOverrides(overrides, theme)
        .map(override => override.svg)
        .filter((override): override is NonNullable<IndicatorIconStyleOverrides["svg"]> => override !== undefined);

    return (props = {}) => {
        const resolvedProps: IndicatorIconSvgVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of svgOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.loading, resolvedProps.loading));
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly IndicatorIconStyleOverrides[],
    theme: ThemeStyle
): readonly IndicatorIconStyleOverrides[] {
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
