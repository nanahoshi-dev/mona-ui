import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import {
    numericTextboxInputVariants as monaNumericTextboxInputVariants,
    numericTextboxVariants as monaNumericTextboxVariants,
    numericTextboxButtonVariants as monaNumericTextboxButtonVariants
} from "./numeric-textbox.mona.styles";
import { VariantInputs } from "../../../utils/VariantInputs";

export const numericTextboxThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNumericTextboxVariants;
        case "shadcn":
            return monaNumericTextboxVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaNumericTextboxVariants; // Default to Mona styles
    }
};

export const numericTextboxInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNumericTextboxInputVariants;
        case "shadcn":
            return monaNumericTextboxInputVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaNumericTextboxInputVariants; // Default to Mona styles
    }
};

export const numericTextboxButtonThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaNumericTextboxButtonVariants;
        case "shadcn":
            return monaNumericTextboxButtonVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaNumericTextboxButtonVariants; // Default to Mona styles
    }
};

export type NumericTextboxVariantProps = VariantProps<ReturnType<typeof numericTextboxThemeVariants>>;
export type NumericTextboxVariantInputs = VariantInputs<NumericTextboxVariantProps>;
