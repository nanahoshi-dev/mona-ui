import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    autoCompleteBaseVariants as monaAutoCompleteBaseVariants,
    autoCompletePopupVariants as monaAutoCompletePopupVariants,
    autoCompleteTextInputVariants as monaAutoCompleteTextInputVariants
} from "./auto-complete.mona.styles";

export const autoCompleteBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaAutoCompleteBaseVariants;
        default:
            return monaAutoCompleteBaseVariants;
    }
};

export const autoCompletePopupThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaAutoCompletePopupVariants;
        default:
            return monaAutoCompletePopupVariants;
    }
};

export const autoCompleteTextInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaAutoCompleteTextInputVariants;
        default:
            return monaAutoCompleteTextInputVariants;
    }
};

type AutoCompleteBaseVariantProps = VariantProps<ReturnType<typeof autoCompleteBaseThemeVariants>>;
type AutoCompleteBaseVariantInput = VariantInputs<AutoCompleteBaseVariantProps>;

type AutoCompletePopupVariantProps = VariantProps<ReturnType<typeof autoCompletePopupThemeVariants>>;
type AutoCompletePopupVariantInput = VariantInputs<AutoCompletePopupVariantProps>;

type AutoCompleteTextInputVariantProps = VariantProps<ReturnType<typeof autoCompleteTextInputThemeVariants>>;
type AutoCompleteTextInputVariantInput = VariantInputs<AutoCompleteTextInputVariantProps>;

export type AutoCompleteVariantProps = AutoCompleteBaseVariantProps &
    AutoCompletePopupVariantProps &
    AutoCompleteTextInputVariantProps;
export type AutoCompleteVariantInput = Omit<AutoCompleteBaseVariantInput, "focused"> &
    AutoCompletePopupVariantInput &
    AutoCompleteTextInputVariantInput;
