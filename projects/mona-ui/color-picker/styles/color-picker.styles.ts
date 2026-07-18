import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    colorPickerBaseVariants as annaColorPickerBaseVariants,
    colorPickerColorVariants as annaColorPickerColorVariants
} from "./color-picker.anna.styles";
import {
    colorPickerBaseVariants as monaColorPickerBaseVariants,
    colorPickerColorVariants as monaColorPickerColorVariants
} from "./color-picker.mona.styles";

export const colorPickerBaseThemeVariants = createThemeStrategy({
    anna: annaColorPickerBaseVariants,
    mona: monaColorPickerBaseVariants
});

export const colorPickerColorThemeVariants = createThemeStrategy({
    anna: annaColorPickerColorVariants,
    mona: monaColorPickerColorVariants
});

type ColorPickerBaseVariantProps = VariantProps<ReturnType<typeof colorPickerBaseThemeVariants>>;
type ColorPickerBaseVariantInput = VariantInputs<ColorPickerBaseVariantProps>;

type ColorPickerColorVariantProps = VariantProps<ReturnType<typeof colorPickerColorThemeVariants>>;
type ColorPickerColorVariantInput = VariantInputs<ColorPickerColorVariantProps>;

export type ColorPickerVariantProps = ColorPickerBaseVariantProps & ColorPickerColorVariantProps;
export type ColorPickerVariantInput = Omit<ColorPickerBaseVariantInput, "expanded"> & ColorPickerColorVariantInput;
