import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    comboBoxBaseVariants as monaComboBoxBaseVariants,
    comboBoxAffixContainerVariants as monaComboBoxAffixContainerVariants,
    comboBoxPopupVariants as monaComboBoxPopupVariants,
    comboBoxTextInputVariants as monaComboBoxTextInputVariants
} from "./combo-box.mona.styles";

export const comboBoxBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaComboBoxBaseVariants;
        default:
            return monaComboBoxBaseVariants;
    }
};

export const comboBoxPopupThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaComboBoxPopupVariants;
        default:
            return monaComboBoxPopupVariants;
    }
};

export const comboBoxTextInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaComboBoxTextInputVariants;
        default:
            return monaComboBoxTextInputVariants;
    }
};

export const comboBoxAffixContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaComboBoxAffixContainerVariants;
        default:
            return monaComboBoxAffixContainerVariants;
    }
};

type ComboBoxBaseVariantProps = VariantProps<ReturnType<typeof comboBoxBaseThemeVariants>>;
type ComboBoxBaseVariantInput = VariantInputs<ComboBoxBaseVariantProps>;

type ComboBoxPopupVariantProps = VariantProps<ReturnType<typeof comboBoxPopupThemeVariants>>;
type ComboBoxPopupVariantInput = VariantInputs<ComboBoxPopupVariantProps>;

type ComboBoxTextInputVariantProps = VariantProps<ReturnType<typeof comboBoxTextInputThemeVariants>>;
type ComboBoxTextInputVariantInput = VariantInputs<ComboBoxTextInputVariantProps>;

type ComboBoxAffixContainerVariantProps = VariantProps<ReturnType<typeof comboBoxAffixContainerThemeVariants>>;
type ComboBoxAffixContainerVariantInput = VariantInputs<ComboBoxAffixContainerVariantProps>;

export type ComboBoxVariantProps = ComboBoxBaseVariantProps &
    ComboBoxPopupVariantProps &
    ComboBoxTextInputVariantProps &
    ComboBoxAffixContainerVariantProps;
export type ComboBoxVariantInput = Omit<ComboBoxBaseVariantInput, "focused"> &
    ComboBoxPopupVariantInput &
    ComboBoxTextInputVariantInput &
    ComboBoxAffixContainerVariantInput;
