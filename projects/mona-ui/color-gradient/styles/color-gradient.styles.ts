import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    colorGradientBaseVariants as annaColorGradientBaseVariants,
    colorGradientHsvRectangleHandleVariants as annaColorGradientHsvRectangleHandleVariants,
    colorGradientHsvRectangleVariants as annaColorGradientHsvRectangleVariants,
    colorGradientPreviewVariants as annaColorGradientPreviewVariants,
    colorGradientSliderHandleVariants as annaColorGradientSliderHandleVariants
} from "./color-gradient.anna.styles";
import {
    colorGradientBaseVariants as monaColorGradientBaseVariants,
    colorGradientHsvRectangleHandleVariants as monaColorGradientHsvRectangleHandleVariants,
    colorGradientHsvRectangleVariants as monaColorGradientHsvRectangleVariants,
    colorGradientPreviewVariants as monaColorGradientPreviewVariants,
    colorGradientSliderHandleVariants as monaColorGradientSliderHandleVariants
} from "./color-gradient.mona.styles";

export const colorGradientBaseThemeVariants = createThemeStrategy({
    anna: annaColorGradientBaseVariants,
    mona: monaColorGradientBaseVariants
});

export const colorGradientHsvRectangleThemeVariants = createThemeStrategy({
    anna: annaColorGradientHsvRectangleVariants,
    mona: monaColorGradientHsvRectangleVariants
});

export const colorGradientHsvRectangleHandleThemeVariants = createThemeStrategy({
    anna: annaColorGradientHsvRectangleHandleVariants,
    mona: monaColorGradientHsvRectangleHandleVariants
});

export const colorGradientPreviewThemeVariants = createThemeStrategy({
    anna: annaColorGradientPreviewVariants,
    mona: monaColorGradientPreviewVariants
});

export const colorGradientSliderHandleThemeVariants = createThemeStrategy({
    anna: annaColorGradientSliderHandleVariants,
    mona: monaColorGradientSliderHandleVariants
});

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
