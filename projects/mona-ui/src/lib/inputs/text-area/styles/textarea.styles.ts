import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { textAreaVariants as monaTextAreaVariants } from "./textarea.mona.styles";
import { VariantInputs } from "@mirei/mona-ui/common";

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
