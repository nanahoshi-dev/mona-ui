/*
 * Public API Surface of @nanahoshi/mona-ui/color-palette
 */

export * from "./components/color-palette/color-palette.component";

export {
    COLOR_PALETTE_STYLE_OVERRIDES,
    COLOR_PALETTE_STYLE_STRATEGY,
    createColorPaletteStyleStrategy,
    provideColorPaletteStyles
} from "./styles/color-palette.styles";
export type {
    ColorPaletteBaseStyleOverrides,
    ColorPaletteBaseVariantInput,
    ColorPaletteBaseVariantProps,
    ColorPaletteItemCompoundStyleOverride,
    ColorPaletteItemStyleOverrides,
    ColorPaletteItemVariantInput,
    ColorPaletteItemVariantProps,
    ColorPaletteStyleOverrides,
    ColorPaletteStylesProviderConfig,
    ColorPaletteStyleStrategy,
    ColorPaletteVariantInput,
    ColorPaletteVariantProps,
    ColorPaletteVariantsFunctions
} from "./styles/color-palette.styles";
