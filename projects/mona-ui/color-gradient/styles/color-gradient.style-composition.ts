import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    ColorGradientBaseStyleOverrides,
    ColorGradientBaseVariantsFunction,
    ColorGradientHsvRectangleHandleStyleOverrides,
    ColorGradientHsvRectangleHandleVariantProps,
    ColorGradientHsvRectangleHandleVariantsFunction,
    ColorGradientHsvRectangleStyleOverrides,
    ColorGradientHsvRectangleVariantProps,
    ColorGradientHsvRectangleVariantsFunction,
    ColorGradientPreviewStyleOverrides,
    ColorGradientPreviewVariantProps,
    ColorGradientPreviewVariantsFunction,
    ColorGradientSliderHandleStyleOverrides,
    ColorGradientSliderHandleVariantsFunction,
    ColorGradientStyleOverrides
} from "./color-gradient.types";

export function createColorGradientBaseVariants(
    base: ColorGradientBaseVariantsFunction,
    overrides: readonly ColorGradientStyleOverrides[],
    theme: ThemeStyle
): ColorGradientBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is ColorGradientBaseStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of baseOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createColorGradientHsvRectangleVariants(
    base: ColorGradientHsvRectangleVariantsFunction,
    overrides: readonly ColorGradientStyleOverrides[],
    theme: ThemeStyle
): ColorGradientHsvRectangleVariantsFunction {
    const hsvRectangleOverrides = activeOverrides(overrides, theme)
        .map(override => override.hsvRectangle)
        .filter((override): override is ColorGradientHsvRectangleStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ColorGradientHsvRectangleVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of hsvRectangleOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
        }

        return twMerge(cx(...classes));
    };
}

export function createColorGradientHsvRectangleHandleVariants(
    base: ColorGradientHsvRectangleHandleVariantsFunction,
    overrides: readonly ColorGradientStyleOverrides[],
    theme: ThemeStyle
): ColorGradientHsvRectangleHandleVariantsFunction {
    const hsvRectangleHandleOverrides = activeOverrides(overrides, theme)
        .map(override => override.hsvRectangleHandle)
        .filter((override): override is ColorGradientHsvRectangleHandleStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ColorGradientHsvRectangleHandleVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of hsvRectangleHandleOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
        }

        return twMerge(cx(...classes));
    };
}

export function createColorGradientPreviewVariants(
    base: ColorGradientPreviewVariantsFunction,
    overrides: readonly ColorGradientStyleOverrides[],
    theme: ThemeStyle
): ColorGradientPreviewVariantsFunction {
    const previewOverrides = activeOverrides(overrides, theme)
        .map(override => override.preview)
        .filter((override): override is ColorGradientPreviewStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: ColorGradientPreviewVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of previewOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
        }

        return twMerge(cx(...classes));
    };
}

export function createColorGradientSliderHandleVariants(
    base: ColorGradientSliderHandleVariantsFunction,
    overrides: readonly ColorGradientStyleOverrides[],
    theme: ThemeStyle
): ColorGradientSliderHandleVariantsFunction {
    const sliderHandleOverrides = activeOverrides(overrides, theme)
        .map(override => override.sliderHandle)
        .filter((override): override is ColorGradientSliderHandleStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of sliderHandleOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly ColorGradientStyleOverrides[],
    theme: ThemeStyle
): readonly ColorGradientStyleOverrides[] {
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
