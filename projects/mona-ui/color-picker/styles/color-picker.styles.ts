import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    colorPickerBaseVariants as monaColorPickerBaseVariants,
    colorPickerColorVariants as monaColorPickerColorVariants
} from "./color-picker.mona.styles";

const colorPickerBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorPickerBaseVariants },
    monaColorPickerBaseVariants
);

export const colorPickerBaseThemeVariants = (theme: ThemeStyle) => colorPickerBaseThemeVariantsStrategy.resolve(theme);

const colorPickerColorThemeVariantsStrategy = createThemeStrategy(
    { mona: monaColorPickerColorVariants },
    monaColorPickerColorVariants
);

export const colorPickerColorThemeVariants = (theme: ThemeStyle) =>
    colorPickerColorThemeVariantsStrategy.resolve(theme);

type ColorPickerBaseVariantProps = VariantProps<ReturnType<typeof colorPickerBaseThemeVariants>>;
type ColorPickerBaseVariantInput = VariantInputs<ColorPickerBaseVariantProps>;

type ColorPickerColorVariantProps = VariantProps<ReturnType<typeof colorPickerColorThemeVariants>>;
type ColorPickerColorVariantInput = VariantInputs<ColorPickerColorVariantProps>;

export type ColorPickerVariantProps = ColorPickerBaseVariantProps & ColorPickerColorVariantProps;
export type ColorPickerVariantInput = Omit<ColorPickerBaseVariantInput, "expanded"> & ColorPickerColorVariantInput;
