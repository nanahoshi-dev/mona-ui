import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
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

const defaultColorGradientBaseStrategy = createInheritedThemeStrategy<ColorGradientBaseVariantsFunction>(
    monaColorGradientBaseVariants,
    { reina: reinaColorGradientBaseVariants }
);
const defaultColorGradientHsvRectangleStrategy =
    createInheritedThemeStrategy<ColorGradientHsvRectangleVariantsFunction>(monaColorGradientHsvRectangleVariants, {
        reina: reinaColorGradientHsvRectangleVariants
    });
const defaultColorGradientHsvRectangleHandleStrategy =
    createInheritedThemeStrategy<ColorGradientHsvRectangleHandleVariantsFunction>(
        monaColorGradientHsvRectangleHandleVariants,
        { reina: reinaColorGradientHsvRectangleHandleVariants }
    );
const defaultColorGradientPreviewStrategy = createInheritedThemeStrategy<ColorGradientPreviewVariantsFunction>(
    monaColorGradientPreviewVariants,
    { reina: reinaColorGradientPreviewVariants }
);
const defaultColorGradientSliderHandleStrategy =
    createInheritedThemeStrategy<ColorGradientSliderHandleVariantsFunction>(monaColorGradientSliderHandleVariants, {
        reina: reinaColorGradientSliderHandleVariants
    });

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
    return createInheritedThemeStrategy<ColorGradientVariantsFunctions>(mona, { reina: reina });
}
