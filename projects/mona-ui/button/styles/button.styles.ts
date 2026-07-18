import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { buttonVariants as annaButtonVariants } from "./button.anna.styles";
import { buttonVariants as monaButtonVariants } from "./button.mona.styles";

export const buttonThemeVariants = createThemeStrategy({
    anna: annaButtonVariants,
    mona: monaButtonVariants
});

export type ButtonVariantProps = VariantProps<ReturnType<typeof buttonThemeVariants>>;
export type ButtonVariantsInput = VariantInputs<ButtonVariantProps>;
