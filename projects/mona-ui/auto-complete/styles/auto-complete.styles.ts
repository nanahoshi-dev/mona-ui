import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    autoCompleteAffixContainerVariants as annaAutoCompleteAffixContainerVariants,
    autoCompleteBaseVariants as annaAutoCompleteBaseVariants,
    autoCompleteTextInputVariants as annaAutoCompleteTextInputVariants
} from "./auto-complete.anna.styles";
import {
    autoCompleteAffixContainerVariants as monaAutoCompleteAffixContainerVariants,
    autoCompleteBaseVariants as monaAutoCompleteBaseVariants,
    autoCompleteTextInputVariants as monaAutoCompleteTextInputVariants
} from "./auto-complete.mona.styles";

export const autoCompleteBaseThemeVariants = createThemeStrategy({
    anna: annaAutoCompleteBaseVariants,
    mona: monaAutoCompleteBaseVariants
});

export const autoCompleteTextInputThemeVariants = createThemeStrategy({
    anna: annaAutoCompleteTextInputVariants,
    mona: monaAutoCompleteTextInputVariants
});

export const autoCompleteAffixContainerThemeVariants = createThemeStrategy({
    anna: annaAutoCompleteAffixContainerVariants,
    mona: monaAutoCompleteAffixContainerVariants
});

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
