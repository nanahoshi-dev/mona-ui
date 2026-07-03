import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    autoCompleteAffixContainerVariants as monaAutoCompleteAffixContainerVariants,
    autoCompleteBaseVariants as monaAutoCompleteBaseVariants,
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

export const autoCompleteTextInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaAutoCompleteTextInputVariants;
        default:
            return monaAutoCompleteTextInputVariants;
    }
};

export const autoCompleteAffixContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaAutoCompleteAffixContainerVariants;
        default:
            return monaAutoCompleteAffixContainerVariants;
    }
};

type AutoCompleteBaseVariantProps = VariantProps<ReturnType<typeof autoCompleteBaseThemeVariants>>;
type AutoCompleteBaseVariantInput = VariantInputs<AutoCompleteBaseVariantProps>;

type AutoCompleteTextInputVariantProps = VariantProps<ReturnType<typeof autoCompleteTextInputThemeVariants>>;
type AutoCompleteTextInputVariantInput = VariantInputs<AutoCompleteTextInputVariantProps>;

type AutoCompleteAffixContainerVariantProps = VariantProps<ReturnType<typeof autoCompleteAffixContainerThemeVariants>>;
type AutoCompleteAffixContainerVariantInput = VariantInputs<AutoCompleteAffixContainerVariantProps>;

export type AutoCompleteVariantProps = AutoCompleteBaseVariantProps &
    AutoCompleteTextInputVariantProps &
    AutoCompleteAffixContainerVariantProps;
export type AutoCompleteVariantInput = Omit<AutoCompleteBaseVariantInput, "expanded" | "focused" | "invalid"> &
    AutoCompleteTextInputVariantInput &
    AutoCompleteAffixContainerVariantInput;
