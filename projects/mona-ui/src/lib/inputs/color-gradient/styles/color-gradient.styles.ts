import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    colorGradientBaseVariants as monaColorGradientBaseVariants,
    colorGradientHsvRectangleVariants as monaColorGradientHsvRectangleVariants,
    colorGradientHsvRectangleHandleVariants as monaColorGradientHsvRectangleHandleVariants,
    colorGradientPreviewVariants as monaColorGradientPreviewVariants
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

export type ColorGradientVariantProps = ColorGradientBaseVariantProps &
    ColorGradientHsvRectangleVariantProps &
    ColorGradientHsvRectangleHandleVariantProps &
    ColorGradientPreviewVariantProps;

export type ColorGradientVariantInputs = ColorGradientVaseVariantInput &
    ColorGradientHsvRectangleVariantInput &
    ColorGradientHsvRectangleHandleVariantInput &
    ColorGradientPreviewVariantInput;
