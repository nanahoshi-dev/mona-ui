import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    autoCompleteAffixContainerVariants as monaAutoCompleteAffixContainerVariants,
    autoCompleteBaseVariants as monaAutoCompleteBaseVariants,
    autoCompleteTextInputVariants as monaAutoCompleteTextInputVariants
} from "./auto-complete.mona.styles";

const autoCompleteBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaAutoCompleteBaseVariants },
    monaAutoCompleteBaseVariants
);

export const autoCompleteBaseThemeVariants = (theme: ThemeStyle) =>
    autoCompleteBaseThemeVariantsStrategy.resolve(theme);

const autoCompleteTextInputThemeVariantsStrategy = createThemeStrategy(
    { mona: monaAutoCompleteTextInputVariants },
    monaAutoCompleteTextInputVariants
);

export const autoCompleteTextInputThemeVariants = (theme: ThemeStyle) =>
    autoCompleteTextInputThemeVariantsStrategy.resolve(theme);

const autoCompleteAffixContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaAutoCompleteAffixContainerVariants },
    monaAutoCompleteAffixContainerVariants
);

export const autoCompleteAffixContainerThemeVariants = (theme: ThemeStyle) =>
    autoCompleteAffixContainerThemeVariantsStrategy.resolve(theme);

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
