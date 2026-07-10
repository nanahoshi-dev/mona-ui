import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { textBoxVariants as monaTextBoxVariants } from "./textbox.mona.styles";
import { inputVariants as monaInputVariants } from "./textbox.mona.styles";

const textBoxThemeVariantsStrategy = createThemeStrategy({ mona: monaTextBoxVariants }, monaTextBoxVariants);

export const textBoxThemeVariants = (theme: ThemeStyle) => textBoxThemeVariantsStrategy.resolve(theme);

const inputThemeVariantsStrategy = createThemeStrategy({ mona: monaInputVariants }, monaInputVariants);

export const inputThemeVariants = (theme: ThemeStyle) => inputThemeVariantsStrategy.resolve(theme);

export type TextBoxVariantProps = VariantProps<ReturnType<typeof textBoxThemeVariants>>;
export type TextBoxVariantInput = VariantInputs<TextBoxVariantProps>;

export type InputVariantProps = VariantProps<ReturnType<typeof inputThemeVariants>>;
export type InputVariantInput = VariantInputs<InputVariantProps>;
