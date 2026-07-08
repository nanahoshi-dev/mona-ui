import { VariantInputs } from "@mirei/mona-ui/internal";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    comboBoxAffixContainerVariants as monaComboBoxAffixContainerVariants,
    comboBoxBaseVariants as monaComboBoxBaseVariants,
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

type ComboBoxTextInputVariantProps = VariantProps<ReturnType<typeof comboBoxTextInputThemeVariants>>;
type ComboBoxTextInputVariantInput = VariantInputs<ComboBoxTextInputVariantProps>;

type ComboBoxAffixContainerVariantProps = VariantProps<ReturnType<typeof comboBoxAffixContainerThemeVariants>>;
type ComboBoxAffixContainerVariantInput = VariantInputs<ComboBoxAffixContainerVariantProps>;

export type ComboBoxVariantProps = ComboBoxBaseVariantProps &
    ComboBoxTextInputVariantProps &
    ComboBoxAffixContainerVariantProps;
export type ComboBoxVariantInput = Omit<ComboBoxBaseVariantInput, "focused" | "invalid"> &
    ComboBoxTextInputVariantInput &
    ComboBoxAffixContainerVariantInput;
