import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { textAreaVariants as monaTextAreaVariants } from "./textarea.mona.styles";
import { VariantInputs } from "../../../utils/VariantInputs";

export const textAreaThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTextAreaVariants;
        case "shadcn":
            return monaTextAreaVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaTextAreaVariants; // Default to Mona styles
    }
};

export type TextAreaVariantProps = VariantProps<ReturnType<typeof textAreaThemeVariants>>;
export type TextAreaVariantInput = VariantInputs<TextAreaVariantProps>;
