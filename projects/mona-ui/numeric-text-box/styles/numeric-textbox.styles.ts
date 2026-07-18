import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    numericTextboxButtonVariants as annaNumericTextboxButtonVariants,
    numericTextboxInputVariants as annaNumericTextboxInputVariants,
    numericTextboxVariants as annaNumericTextboxVariants
} from "./numeric-textbox.anna.styles";
import {
    numericTextboxButtonVariants as monaNumericTextboxButtonVariants,
    numericTextboxInputVariants as monaNumericTextboxInputVariants,
    numericTextboxVariants as monaNumericTextboxVariants
} from "./numeric-textbox.mona.styles";

export const numericTextboxThemeVariants = createThemeStrategy({
    anna: annaNumericTextboxVariants,
    mona: monaNumericTextboxVariants
});

export const numericTextboxInputThemeVariants = createThemeStrategy({
    anna: annaNumericTextboxInputVariants,
    mona: monaNumericTextboxInputVariants
});

export const numericTextboxButtonThemeVariants = createThemeStrategy({
    anna: annaNumericTextboxButtonVariants,
    mona: monaNumericTextboxButtonVariants
});

export type NumericTextboxVariantProps = VariantProps<ReturnType<typeof numericTextboxThemeVariants>>;
export type NumericTextboxVariantInputs = VariantInputs<NumericTextboxVariantProps>;
