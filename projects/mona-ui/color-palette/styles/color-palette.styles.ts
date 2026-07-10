import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    colorPaletteBaseVariants as monaColorPaletteBaseVariants,
    colorPaletteItemVariants as monaColorPaletteItemVariants
} from "./color-palette.mona.styles";

const colorPaletteBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorPaletteBaseVariants },
    monaColorPaletteBaseVariants
);

export const colorPaletteBaseThemeVariants = (theme: ThemeStyle) =>
    colorPaletteBaseThemeVariantsStrategy.resolve(theme);

const colorPaletteItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorPaletteItemVariants },
    monaColorPaletteItemVariants
);

export const colorPaletteItemThemeVariants = (theme: ThemeStyle) =>
    colorPaletteItemThemeVariantsStrategy.resolve(theme);

type ColorPaletteBaseVariantProps = VariantProps<ReturnType<typeof colorPaletteBaseThemeVariants>>;
type ColorPaletteBaseVariantInput = VariantInputs<ColorPaletteBaseVariantProps>;

type ColorPaletteItemVariantProps = VariantProps<ReturnType<typeof colorPaletteItemThemeVariants>>;
type ColorPaletteItemVariantInput = VariantInputs<ColorPaletteItemVariantProps>;

export type ColorPaletteVariantProps = ColorPaletteBaseVariantProps & ColorPaletteItemVariantProps;
export type ColorPaletteVariantInput = ColorPaletteBaseVariantInput & ColorPaletteItemVariantInput;
