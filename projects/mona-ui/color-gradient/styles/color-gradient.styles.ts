import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const colorGradientBaseThemeVariants = cva(
    `
        flex flex-col min-w-64
        gap-2 p-2
        select-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        data-[invalid='true']:border
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-1
        data-[invalid='true']:ring-error/35
    `
);

export const colorGradientHsvRectangleThemeVariants = cva(
    `
        relative h-40 w-full
        bg-[linear-gradient(to_bottom,rgba(0,0,0,0),black),linear-gradient(to_right,white,rgba(255,255,255,0))]
        border border-border-subtle
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-lg" // Full is not suitable for color gradient rectangle.
            }
        }
    }
);

export const colorGradientHsvRectangleHandleThemeVariants = cva(
    `
        absolute
        h-3 w-3
        cursor-pointer
        bg-transparent
        border-2 border-black/90 outline outline-white/90 shadow-sm

        focus-visible:ring-2 focus-visible:ring-focus-indicator/35
        focus-visible:ring-offset-2 focus-visible:ring-offset-surface
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);

export const colorGradientPreviewThemeVariants = cva(
    `
        flex h-10 w-10
        border border-border-subtle
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);

export const colorGradientSliderHandleThemeVariants = cva(
    `
        h-3 w-3
        bg-transparent
        border-3 border-white/90
        outline outline-solid outline-black/90
    `
);

type ColorGradientBaseVariantProps = VariantProps<typeof colorGradientBaseThemeVariants>;

type ColorGradientVaseVariantInput = VariantInputs<ColorGradientBaseVariantProps>;

type ColorGradientHsvRectangleVariantProps = VariantProps<typeof colorGradientHsvRectangleThemeVariants>;

type ColorGradientHsvRectangleVariantInput = VariantInputs<ColorGradientHsvRectangleVariantProps>;

type ColorGradientHsvRectangleHandleVariantProps = VariantProps<typeof colorGradientHsvRectangleHandleThemeVariants>;

type ColorGradientHsvRectangleHandleVariantInput = VariantInputs<ColorGradientHsvRectangleHandleVariantProps>;

type ColorGradientPreviewVariantProps = VariantProps<typeof colorGradientPreviewThemeVariants>;

type ColorGradientPreviewVariantInput = VariantInputs<ColorGradientPreviewVariantProps>;

type ColorGradientSliderHandleVariantProps = VariantProps<typeof colorGradientSliderHandleThemeVariants>;

type ColorGradientSliderHandleVariantInput = VariantInputs<ColorGradientSliderHandleVariantProps>;

export type ColorGradientVariantProps = ColorGradientBaseVariantProps &
    ColorGradientHsvRectangleVariantProps &
    ColorGradientHsvRectangleHandleVariantProps &
    ColorGradientPreviewVariantProps &
    ColorGradientSliderHandleVariantProps;

export type ColorGradientVariantInputs = ColorGradientVaseVariantInput &
    ColorGradientHsvRectangleVariantInput &
    ColorGradientHsvRectangleHandleVariantInput &
    ColorGradientPreviewVariantInput &
    ColorGradientSliderHandleVariantInput;
