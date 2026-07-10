import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    numericTextboxButtonVariants as monaNumericTextboxButtonVariants,
    numericTextboxInputVariants as monaNumericTextboxInputVariants,
    numericTextboxVariants as monaNumericTextboxVariants
} from "./numeric-textbox.mona.styles";

const numericTextboxThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNumericTextboxVariants },
    monaNumericTextboxVariants
);

export const numericTextboxThemeVariants = (theme: ThemeStyle) => numericTextboxThemeVariantsStrategy.resolve(theme);

const numericTextboxInputThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNumericTextboxInputVariants },
    monaNumericTextboxInputVariants
);

export const numericTextboxInputThemeVariants = (theme: ThemeStyle) =>
    numericTextboxInputThemeVariantsStrategy.resolve(theme);

const numericTextboxButtonThemeVariantsStrategy = createThemeStrategy(
    { mona: monaNumericTextboxButtonVariants },
    monaNumericTextboxButtonVariants
);

export const numericTextboxButtonThemeVariants = (theme: ThemeStyle) =>
    numericTextboxButtonThemeVariantsStrategy.resolve(theme);

export type NumericTextboxVariantProps = VariantProps<ReturnType<typeof numericTextboxThemeVariants>>;
export type NumericTextboxVariantInputs = VariantInputs<NumericTextboxVariantProps>;
