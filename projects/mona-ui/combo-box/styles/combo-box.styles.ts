import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    comboBoxAffixContainerVariants as monaComboBoxAffixContainerVariants,
    comboBoxBaseVariants as monaComboBoxBaseVariants,
    comboBoxTextInputVariants as monaComboBoxTextInputVariants
} from "./combo-box.mona.styles";

const comboBoxBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaComboBoxBaseVariants },
    monaComboBoxBaseVariants
);

export const comboBoxBaseThemeVariants = (theme: ThemeStyle) => comboBoxBaseThemeVariantsStrategy.resolve(theme);

const comboBoxTextInputThemeVariantsStrategy = createThemeStrategy(
    { mona: monaComboBoxTextInputVariants },
    monaComboBoxTextInputVariants
);

export const comboBoxTextInputThemeVariants = (theme: ThemeStyle) =>
    comboBoxTextInputThemeVariantsStrategy.resolve(theme);

const comboBoxAffixContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaComboBoxAffixContainerVariants },
    monaComboBoxAffixContainerVariants
);

export const comboBoxAffixContainerThemeVariants = (theme: ThemeStyle) =>
    comboBoxAffixContainerThemeVariantsStrategy.resolve(theme);

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
