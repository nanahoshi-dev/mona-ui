import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    colorGradientBaseVariants as monaColorGradientBaseVariants,
    colorGradientHsvRectangleHandleVariants as monaColorGradientHsvRectangleHandleVariants,
    colorGradientHsvRectangleVariants as monaColorGradientHsvRectangleVariants,
    colorGradientPreviewVariants as monaColorGradientPreviewVariants,
    colorGradientSliderHandleVariants as monaColorGradientSliderHandleVariants
} from "./color-gradient.mona.styles";
import {
    reinaColorGradientBaseVariants,
    reinaColorGradientHsvRectangleHandleVariants,
    reinaColorGradientHsvRectangleVariants,
    reinaColorGradientPreviewVariants,
    reinaColorGradientSliderHandleVariants
} from "./color-gradient.reina.styles";
import {
    createColorGradientBaseVariants,
    createColorGradientHsvRectangleHandleVariants,
    createColorGradientHsvRectangleVariants,
    createColorGradientPreviewVariants,
    createColorGradientSliderHandleVariants
} from "./color-gradient.style-composition";
import type {
    ColorGradientBaseVariantsFunction,
    ColorGradientHsvRectangleHandleVariantsFunction,
    ColorGradientHsvRectangleVariantsFunction,
    ColorGradientPreviewVariantsFunction,
    ColorGradientSliderHandleVariantsFunction,
    ColorGradientStyleOverrides,
    ColorGradientStyleStrategy,
    ColorGradientVariantsFunctions
} from "./color-gradient.types";

const defaultColorGradientBaseStrategy = createThemeStrategy<ColorGradientBaseVariantsFunction>(
    { mona: monaColorGradientBaseVariants, reina: reinaColorGradientBaseVariants },
    monaColorGradientBaseVariants
);
const defaultColorGradientHsvRectangleStrategy = createThemeStrategy<ColorGradientHsvRectangleVariantsFunction>(
    { mona: monaColorGradientHsvRectangleVariants, reina: reinaColorGradientHsvRectangleVariants },
    monaColorGradientHsvRectangleVariants
);
const defaultColorGradientHsvRectangleHandleStrategy =
    createThemeStrategy<ColorGradientHsvRectangleHandleVariantsFunction>(
        { mona: monaColorGradientHsvRectangleHandleVariants, reina: reinaColorGradientHsvRectangleHandleVariants },
        monaColorGradientHsvRectangleHandleVariants
    );
const defaultColorGradientPreviewStrategy = createThemeStrategy<ColorGradientPreviewVariantsFunction>(
    { mona: monaColorGradientPreviewVariants, reina: reinaColorGradientPreviewVariants },
    monaColorGradientPreviewVariants
);
const defaultColorGradientSliderHandleStrategy = createThemeStrategy<ColorGradientSliderHandleVariantsFunction>(
    { mona: monaColorGradientSliderHandleVariants, reina: reinaColorGradientSliderHandleVariants },
    monaColorGradientSliderHandleVariants
);

export const colorGradientBaseThemeVariants = (theme: ThemeStyle): ColorGradientBaseVariantsFunction =>
    defaultColorGradientBaseStrategy.resolve(theme);
export const colorGradientHsvRectangleThemeVariants = (theme: ThemeStyle): ColorGradientHsvRectangleVariantsFunction =>
    defaultColorGradientHsvRectangleStrategy.resolve(theme);
export const colorGradientHsvRectangleHandleThemeVariants = (
    theme: ThemeStyle
): ColorGradientHsvRectangleHandleVariantsFunction => defaultColorGradientHsvRectangleHandleStrategy.resolve(theme);
export const colorGradientPreviewThemeVariants = (theme: ThemeStyle): ColorGradientPreviewVariantsFunction =>
    defaultColorGradientPreviewStrategy.resolve(theme);
export const colorGradientSliderHandleThemeVariants = (theme: ThemeStyle): ColorGradientSliderHandleVariantsFunction =>
    defaultColorGradientSliderHandleStrategy.resolve(theme);

export function createColorGradientStyleStrategy(
    overrides: readonly ColorGradientStyleOverrides[] = []
): ColorGradientStyleStrategy {
    const mona: ColorGradientVariantsFunctions = {
        base: createColorGradientBaseVariants(monaColorGradientBaseVariants, overrides, "mona"),
        hsvRectangle: createColorGradientHsvRectangleVariants(monaColorGradientHsvRectangleVariants, overrides, "mona"),
        hsvRectangleHandle: createColorGradientHsvRectangleHandleVariants(
            monaColorGradientHsvRectangleHandleVariants,
            overrides,
            "mona"
        ),
        preview: createColorGradientPreviewVariants(monaColorGradientPreviewVariants, overrides, "mona"),
        sliderHandle: createColorGradientSliderHandleVariants(monaColorGradientSliderHandleVariants, overrides, "mona")
    };
    const reina: ColorGradientVariantsFunctions = {
        base: createColorGradientBaseVariants(reinaColorGradientBaseVariants, overrides, "reina"),
        hsvRectangle: createColorGradientHsvRectangleVariants(
            reinaColorGradientHsvRectangleVariants,
            overrides,
            "reina"
        ),
        hsvRectangleHandle: createColorGradientHsvRectangleHandleVariants(
            reinaColorGradientHsvRectangleHandleVariants,
            overrides,
            "reina"
        ),
        preview: createColorGradientPreviewVariants(reinaColorGradientPreviewVariants, overrides, "reina"),
        sliderHandle: createColorGradientSliderHandleVariants(
            reinaColorGradientSliderHandleVariants,
            overrides,
            "reina"
        )
    };
    return createThemeStrategy<ColorGradientVariantsFunctions>({ mona, reina }, mona);
}
