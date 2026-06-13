import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { textBoxVariants as monaTextBoxVariants } from "./textbox.mona.styles";
import { inputVariants as monaInputVariants } from "./textbox.mona.styles";
import { VariantInputs } from "../../../utils/VariantInputs";

export const textBoxThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTextBoxVariants;
        default:
            return monaTextBoxVariants; // Default to Mona styles
    }
};

export const inputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaInputVariants;
        default:
            return monaInputVariants; // Default to Mona styles
    }
};

export type TextBoxVariantProps = VariantProps<ReturnType<typeof textBoxThemeVariants>>;
export type TextBoxVariantInput = VariantInputs<TextBoxVariantProps>;

export type InputVariantProps = VariantProps<ReturnType<typeof inputThemeVariants>>;
export type InputVariantInput = VariantInputs<InputVariantProps>;
