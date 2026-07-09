import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    colorGradientBaseVariants as monaColorGradientBaseVariants,
    colorGradientHsvRectangleHandleVariants as monaColorGradientHsvRectangleHandleVariants,
    colorGradientHsvRectangleVariants as monaColorGradientHsvRectangleVariants,
    colorGradientPreviewVariants as monaColorGradientPreviewVariants,
    colorGradientSliderHandleVariants as monaColorGradientSliderHandleVariants
} from "./color-gradient.mona.styles";

export const colorGradientBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorGradientBaseVariants;
        default:
            return monaColorGradientBaseVariants;
    }
};

export const colorGradientHsvRectangleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorGradientHsvRectangleVariants;
        default:
            return monaColorGradientHsvRectangleVariants;
    }
};

export const colorGradientHsvRectangleHandleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorGradientHsvRectangleHandleVariants;
        default:
            return monaColorGradientHsvRectangleHandleVariants;
    }
};

export const colorGradientPreviewThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorGradientPreviewVariants;
        default:
            return monaColorGradientPreviewVariants;
    }
};

export const colorGradientSliderHandleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorGradientSliderHandleVariants;
        default:
            return monaColorGradientSliderHandleVariants;
    }
};

type ColorGradientBaseVariantProps = VariantProps<ReturnType<typeof colorGradientBaseThemeVariants>>;
type ColorGradientVaseVariantInput = VariantInputs<ColorGradientBaseVariantProps>;

type ColorGradientHsvRectangleVariantProps = VariantProps<ReturnType<typeof colorGradientHsvRectangleThemeVariants>>;
type ColorGradientHsvRectangleVariantInput = VariantInputs<ColorGradientHsvRectangleVariantProps>;

type ColorGradientHsvRectangleHandleVariantProps = VariantProps<
    ReturnType<typeof colorGradientHsvRectangleHandleThemeVariants>
>;
type ColorGradientHsvRectangleHandleVariantInput = VariantInputs<ColorGradientHsvRectangleHandleVariantProps>;

type ColorGradientPreviewVariantProps = VariantProps<ReturnType<typeof colorGradientPreviewThemeVariants>>;
type ColorGradientPreviewVariantInput = VariantInputs<ColorGradientPreviewVariantProps>;

type ColorGradientSliderHandleVariantProps = VariantProps<ReturnType<typeof colorGradientSliderHandleThemeVariants>>;
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
