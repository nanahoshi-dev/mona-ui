import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/common";
import {
    colorPickerBaseVariants as monaColorPickerBaseVariants,
    colorPickerColorVariants as monaColorPickerColorVariants
} from "./color-picker.mona.styles";

export const colorPickerBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorPickerBaseVariants;
        default:
            return monaColorPickerBaseVariants;
    }
};

export const colorPickerColorThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaColorPickerColorVariants;
        default:
            return monaColorPickerColorVariants;
    }
};

type ColorPickerBaseVariantProps = VariantProps<ReturnType<typeof colorPickerBaseThemeVariants>>;
type ColorPickerBaseVariantInput = VariantInputs<ColorPickerBaseVariantProps>;

type ColorPickerColorVariantProps = VariantProps<ReturnType<typeof colorPickerColorThemeVariants>>;
type ColorPickerColorVariantInput = VariantInputs<ColorPickerColorVariantProps>;

export type ColorPickerVariantProps = ColorPickerBaseVariantProps & ColorPickerColorVariantProps;
export type ColorPickerVariantInput = Omit<ColorPickerBaseVariantInput, "expanded"> & ColorPickerColorVariantInput;
