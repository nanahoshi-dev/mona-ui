import { VariantInputs } from "@mirei/mona-ui/internal";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    colorPaletteBaseVariants as monaColorPaletteBaseVariants,
    colorPaletteItemVariants as monaColorPaletteItemVariants
} from "./color-palette.mona.styles";

export const colorPaletteBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorPaletteBaseVariants;
        default:
            return monaColorPaletteBaseVariants;
    }
};

export const colorPaletteItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorPaletteItemVariants;
        default:
            return monaColorPaletteItemVariants;
    }
};

type ColorPaletteBaseVariantProps = VariantProps<ReturnType<typeof colorPaletteBaseThemeVariants>>;
type ColorPaletteBaseVariantInput = VariantInputs<ColorPaletteBaseVariantProps>;

type ColorPaletteItemVariantProps = VariantProps<ReturnType<typeof colorPaletteItemThemeVariants>>;
type ColorPaletteItemVariantInput = VariantInputs<ColorPaletteItemVariantProps>;

export type ColorPaletteVariantProps = ColorPaletteBaseVariantProps & ColorPaletteItemVariantProps;
export type ColorPaletteVariantInput = ColorPaletteBaseVariantInput & ColorPaletteItemVariantInput;
