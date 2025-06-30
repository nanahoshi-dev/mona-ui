import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "mona-ui";
import { textBoxVariants as mona } from "mona-ui/inputs/text-box/styles/textbox.mona.styles";
import { inputVariants as monaInput } from "mona-ui/inputs/text-box/styles/textbox.mona.styles";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const textBoxThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return mona;
        case "shadcn":
            return mona; // Placeholder for Shadcn styles, if available
        default:
            return mona; // Default to Mona styles
    }
};

export const inputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaInput;
        case "shadcn":
            return monaInput; // Placeholder for Shadcn styles, if available
        default:
            return monaInput; // Default to Mona styles
    }
};

export type TextBoxVariantProps = VariantProps<ReturnType<typeof textBoxThemeVariants>>;
export type TextBoxVariantInput = VariantInputs<TextBoxVariantProps>;

export type InputVariantProps = VariantProps<ReturnType<typeof inputThemeVariants>>;
export type InputVariantInput = VariantInputs<InputVariantProps>;
