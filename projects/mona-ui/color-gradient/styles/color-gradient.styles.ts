import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    colorGradientBaseVariants as monaColorGradientBaseVariants,
    colorGradientHsvRectangleHandleVariants as monaColorGradientHsvRectangleHandleVariants,
    colorGradientHsvRectangleVariants as monaColorGradientHsvRectangleVariants,
    colorGradientPreviewVariants as monaColorGradientPreviewVariants,
    colorGradientSliderHandleVariants as monaColorGradientSliderHandleVariants
} from "./color-gradient.mona.styles";

const colorGradientBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorGradientBaseVariants },
    monaColorGradientBaseVariants
);

export const colorGradientBaseThemeVariants = (theme: ThemeStyle) =>
    colorGradientBaseThemeVariantsStrategy.resolve(theme);

const colorGradientHsvRectangleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorGradientHsvRectangleVariants },
    monaColorGradientHsvRectangleVariants
);

export const colorGradientHsvRectangleThemeVariants = (theme: ThemeStyle) =>
    colorGradientHsvRectangleThemeVariantsStrategy.resolve(theme);

const colorGradientHsvRectangleHandleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorGradientHsvRectangleHandleVariants },
    monaColorGradientHsvRectangleHandleVariants
);

export const colorGradientHsvRectangleHandleThemeVariants = (theme: ThemeStyle) =>
    colorGradientHsvRectangleHandleThemeVariantsStrategy.resolve(theme);

const colorGradientPreviewThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorGradientPreviewVariants },
    monaColorGradientPreviewVariants
);

export const colorGradientPreviewThemeVariants = (theme: ThemeStyle) =>
    colorGradientPreviewThemeVariantsStrategy.resolve(theme);

const colorGradientSliderHandleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorGradientSliderHandleVariants },
    monaColorGradientSliderHandleVariants
);

export const colorGradientSliderHandleThemeVariants = (theme: ThemeStyle) =>
    colorGradientSliderHandleThemeVariantsStrategy.resolve(theme);

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
