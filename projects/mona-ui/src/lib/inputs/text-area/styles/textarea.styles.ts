import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "mona-ui";
import { textAreaVariants as mona } from "mona-ui/inputs/text-area/styles/textarea.mona.styles";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const textAreaThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return mona;
        case "shadcn":
            return mona; // Placeholder for Shadcn styles, if available
        default:
            return mona; // Default to Mona styles
    }
};

export type TextAreaVariantProps = VariantProps<ReturnType<typeof textAreaThemeVariants>>;
export type TextAreaVariantInput = VariantInputs<TextAreaVariantProps>;
