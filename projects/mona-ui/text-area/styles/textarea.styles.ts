import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { textAreaVariants as monaTextAreaVariants } from "./textarea.mona.styles";

export const textAreaThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTextAreaVariants;
        default:
            return monaTextAreaVariants;
    }
};

export type TextAreaVariantProps = VariantProps<ReturnType<typeof textAreaThemeVariants>>;
export type TextAreaVariantInput = VariantInputs<TextAreaVariantProps>;
