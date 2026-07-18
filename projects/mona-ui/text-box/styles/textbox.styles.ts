import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { textBoxVariants as annaTextBoxVariants } from "./textbox.anna.styles";
import { textBoxVariants as monaTextBoxVariants } from "./textbox.mona.styles";
import { inputVariants as annaInputVariants } from "./textbox.anna.styles";
import { inputVariants as monaInputVariants } from "./textbox.mona.styles";

export const textBoxThemeVariants = createThemeStrategy({
    anna: annaTextBoxVariants,
    mona: monaTextBoxVariants
});

export const inputThemeVariants = createThemeStrategy({
    anna: annaInputVariants,
    mona: monaInputVariants
});

export type TextBoxVariantProps = VariantProps<ReturnType<typeof textBoxThemeVariants>>;
export type TextBoxVariantInput = VariantInputs<TextBoxVariantProps>;

export type InputVariantProps = VariantProps<ReturnType<typeof inputThemeVariants>>;
export type InputVariantInput = VariantInputs<InputVariantProps>;
