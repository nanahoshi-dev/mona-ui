import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    comboBoxAffixContainerVariants as annaComboBoxAffixContainerVariants,
    comboBoxBaseVariants as annaComboBoxBaseVariants,
    comboBoxTextInputVariants as annaComboBoxTextInputVariants
} from "./combo-box.anna.styles";
import {
    comboBoxAffixContainerVariants as monaComboBoxAffixContainerVariants,
    comboBoxBaseVariants as monaComboBoxBaseVariants,
    comboBoxTextInputVariants as monaComboBoxTextInputVariants
} from "./combo-box.mona.styles";

export const comboBoxBaseThemeVariants = createThemeStrategy({
    anna: annaComboBoxBaseVariants,
    mona: monaComboBoxBaseVariants
});

export const comboBoxTextInputThemeVariants = createThemeStrategy({
    anna: annaComboBoxTextInputVariants,
    mona: monaComboBoxTextInputVariants
});

export const comboBoxAffixContainerThemeVariants = createThemeStrategy({
    anna: annaComboBoxAffixContainerVariants,
    mona: monaComboBoxAffixContainerVariants
});

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
