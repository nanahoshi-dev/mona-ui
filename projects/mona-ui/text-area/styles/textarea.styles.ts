import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { textAreaVariants as monaTextAreaVariants } from "./textarea.mona.styles";

const textAreaThemeVariantsStrategy = createThemeStrategy({ mona: monaTextAreaVariants }, monaTextAreaVariants);

export const textAreaThemeVariants = (theme: ThemeStyle) => textAreaThemeVariantsStrategy.resolve(theme);

export type TextAreaVariantProps = VariantProps<ReturnType<typeof textAreaThemeVariants>>;
export type TextAreaVariantInput = VariantInputs<TextAreaVariantProps>;
