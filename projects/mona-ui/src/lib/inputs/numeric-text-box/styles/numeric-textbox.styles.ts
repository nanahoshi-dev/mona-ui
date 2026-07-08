import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import {
    numericTextboxInputVariants as monaNumericTextboxInputVariants,
    numericTextboxVariants as monaNumericTextboxVariants,
    numericTextboxButtonVariants as monaNumericTextboxButtonVariants
} from "./numeric-textbox.mona.styles";
import { VariantInputs } from "@mirei/mona-ui/common";

export const numericTextboxThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNumericTextboxVariants;
        default:
            return monaNumericTextboxVariants; // Default to Mona styles
    }
};

export const numericTextboxInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNumericTextboxInputVariants;
        default:
            return monaNumericTextboxInputVariants; // Default to Mona styles
    }
};

export const numericTextboxButtonThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNumericTextboxButtonVariants;
        default:
            return monaNumericTextboxButtonVariants; // Default to Mona styles
    }
};

export type NumericTextboxVariantProps = VariantProps<ReturnType<typeof numericTextboxThemeVariants>>;
export type NumericTextboxVariantInputs = VariantInputs<NumericTextboxVariantProps>;
