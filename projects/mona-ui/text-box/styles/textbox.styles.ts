import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@mirei/mona-ui/common";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { textBoxVariants as monaTextBoxVariants } from "./textbox.mona.styles";
import { inputVariants as monaInputVariants } from "./textbox.mona.styles";

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
