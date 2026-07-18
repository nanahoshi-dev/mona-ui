import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    colorPaletteBaseVariants as annaColorPaletteBaseVariants,
    colorPaletteItemVariants as annaColorPaletteItemVariants
} from "./color-palette.anna.styles";
import {
    colorPaletteBaseVariants as monaColorPaletteBaseVariants,
    colorPaletteItemVariants as monaColorPaletteItemVariants
} from "./color-palette.mona.styles";

export const colorPaletteBaseThemeVariants = createThemeStrategy({
    anna: annaColorPaletteBaseVariants,
    mona: monaColorPaletteBaseVariants
});

export const colorPaletteItemThemeVariants = createThemeStrategy({
    anna: annaColorPaletteItemVariants,
    mona: monaColorPaletteItemVariants
});

type ColorPaletteBaseVariantProps = VariantProps<ReturnType<typeof colorPaletteBaseThemeVariants>>;
type ColorPaletteBaseVariantInput = VariantInputs<ColorPaletteBaseVariantProps>;

type ColorPaletteItemVariantProps = VariantProps<ReturnType<typeof colorPaletteItemThemeVariants>>;
type ColorPaletteItemVariantInput = VariantInputs<ColorPaletteItemVariantProps>;

export type ColorPaletteVariantProps = ColorPaletteBaseVariantProps & ColorPaletteItemVariantProps;
export type ColorPaletteVariantInput = ColorPaletteBaseVariantInput & ColorPaletteItemVariantInput;
