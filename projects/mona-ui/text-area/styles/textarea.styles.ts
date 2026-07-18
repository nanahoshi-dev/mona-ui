import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { textAreaVariants as annaTextAreaVariants } from "./textarea.anna.styles";
import { textAreaVariants as monaTextAreaVariants } from "./textarea.mona.styles";

export const textAreaThemeVariants = createThemeStrategy({
    anna: annaTextAreaVariants,
    mona: monaTextAreaVariants
});

export type TextAreaVariantProps = VariantProps<ReturnType<typeof textAreaThemeVariants>>;
export type TextAreaVariantInput = VariantInputs<TextAreaVariantProps>;
