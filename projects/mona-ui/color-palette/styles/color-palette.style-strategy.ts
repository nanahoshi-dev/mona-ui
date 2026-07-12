import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    colorPaletteBaseVariants as monaColorPaletteBaseVariants,
    colorPaletteItemVariants as monaColorPaletteItemVariants
} from "./color-palette.mona.styles";
import { reinaColorPaletteBaseVariants, reinaColorPaletteItemVariants } from "./color-palette.reina.styles";
import { createColorPaletteBaseVariants, createColorPaletteItemVariants } from "./color-palette.style-composition";
import type {
    ColorPaletteBaseVariantsFunction,
    ColorPaletteItemVariantsFunction,
    ColorPaletteStyleOverrides,
    ColorPaletteStyleStrategy,
    ColorPaletteVariantsFunctions
} from "./color-palette.types";

const defaultColorPaletteBaseStrategy = createInheritedThemeStrategy<ColorPaletteBaseVariantsFunction>(
    monaColorPaletteBaseVariants,
    { reina: reinaColorPaletteBaseVariants }
);
const defaultColorPaletteItemStrategy = createInheritedThemeStrategy<ColorPaletteItemVariantsFunction>(
    monaColorPaletteItemVariants,
    { reina: reinaColorPaletteItemVariants }
);

export const colorPaletteBaseThemeVariants = (theme: ThemeStyle): ColorPaletteBaseVariantsFunction =>
    defaultColorPaletteBaseStrategy.resolve(theme);
export const colorPaletteItemThemeVariants = (theme: ThemeStyle): ColorPaletteItemVariantsFunction =>
    defaultColorPaletteItemStrategy.resolve(theme);

export function createColorPaletteStyleStrategy(
    overrides: readonly ColorPaletteStyleOverrides[] = []
): ColorPaletteStyleStrategy {
    const mona: ColorPaletteVariantsFunctions = {
        base: createColorPaletteBaseVariants(monaColorPaletteBaseVariants, overrides, "mona"),
        item: createColorPaletteItemVariants(monaColorPaletteItemVariants, overrides, "mona")
    };
    const reina: ColorPaletteVariantsFunctions = {
        base: createColorPaletteBaseVariants(reinaColorPaletteBaseVariants, overrides, "reina"),
        item: createColorPaletteItemVariants(reinaColorPaletteItemVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<ColorPaletteVariantsFunctions>(mona, { reina: reina });
}
