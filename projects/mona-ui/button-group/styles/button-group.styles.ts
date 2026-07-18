import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { buttonGroupVariants as annaButtonGroupVariants } from "./button-group.anna.styles";
import { buttonGroupVariants as monaButtonGroupVariants } from "./button-group.mona.styles";

export const buttonGroupThemeVariants = createThemeStrategy({
    anna: annaButtonGroupVariants,
    mona: monaButtonGroupVariants
});

export type ButtonGroupVariantProps = VariantProps<ReturnType<typeof buttonGroupThemeVariants>>;
export type ButtonGroupVariantsInput = VariantInputs<ButtonGroupVariantProps>;
