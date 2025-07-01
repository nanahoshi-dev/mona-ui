import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "mona-ui";
import { textBoxVariants as monaTextBoxVariants } from "mona-ui/inputs/text-box/styles/textbox.mona.styles";
import { inputVariants as monaInputVariants } from "mona-ui/inputs/text-box/styles/textbox.mona.styles";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const textBoxThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTextBoxVariants;
        case "shadcn":
            return monaTextBoxVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaTextBoxVariants; // Default to Mona styles
    }
};

export const inputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaInputVariants;
        case "shadcn":
            return monaInputVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaInputVariants; // Default to Mona styles
    }
};

export type TextBoxVariantProps = VariantProps<ReturnType<typeof textBoxThemeVariants>>;
export type TextBoxVariantInput = VariantInputs<TextBoxVariantProps>;

export type InputVariantProps = VariantProps<ReturnType<typeof inputThemeVariants>>;
export type InputVariantInput = VariantInputs<InputVariantProps>;
