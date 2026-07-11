import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    comboBoxAffixContainerVariants as monaComboBoxAffixContainerVariants,
    comboBoxBaseVariants as monaComboBoxBaseVariants,
    comboBoxTextInputVariants as monaComboBoxTextInputVariants
} from "./combo-box.mona.styles";
import {
    reinaComboBoxAffixContainerVariants,
    reinaComboBoxBaseVariants,
    reinaComboBoxTextInputVariants
} from "./combo-box.reina.styles";
import {
    createComboBoxAffixContainerVariants,
    createComboBoxBaseVariants,
    createComboBoxTextInputVariants
} from "./combo-box.style-composition";
import type {
    ComboBoxAffixContainerVariantsFunction,
    ComboBoxBaseVariantsFunction,
    ComboBoxStyleOverrides,
    ComboBoxStyleStrategy,
    ComboBoxTextInputVariantsFunction,
    ComboBoxVariantsFunctions
} from "./combo-box.types";

const defaultComboBoxBaseStrategy = createThemeStrategy<ComboBoxBaseVariantsFunction>(
    { mona: monaComboBoxBaseVariants, reina: reinaComboBoxBaseVariants },
    monaComboBoxBaseVariants
);
const defaultComboBoxTextInputStrategy = createThemeStrategy<ComboBoxTextInputVariantsFunction>(
    { mona: monaComboBoxTextInputVariants, reina: reinaComboBoxTextInputVariants },
    monaComboBoxTextInputVariants
);
const defaultComboBoxAffixContainerStrategy = createThemeStrategy<ComboBoxAffixContainerVariantsFunction>(
    { mona: monaComboBoxAffixContainerVariants, reina: reinaComboBoxAffixContainerVariants },
    monaComboBoxAffixContainerVariants
);

export const comboBoxBaseThemeVariants = (theme: ThemeStyle): ComboBoxBaseVariantsFunction =>
    defaultComboBoxBaseStrategy.resolve(theme);
export const comboBoxTextInputThemeVariants = (theme: ThemeStyle): ComboBoxTextInputVariantsFunction =>
    defaultComboBoxTextInputStrategy.resolve(theme);
export const comboBoxAffixContainerThemeVariants = (theme: ThemeStyle): ComboBoxAffixContainerVariantsFunction =>
    defaultComboBoxAffixContainerStrategy.resolve(theme);

export function createComboBoxStyleStrategy(overrides: readonly ComboBoxStyleOverrides[] = []): ComboBoxStyleStrategy {
    const mona: ComboBoxVariantsFunctions = {
        affixContainer: createComboBoxAffixContainerVariants(monaComboBoxAffixContainerVariants, overrides, "mona"),
        base: createComboBoxBaseVariants(monaComboBoxBaseVariants, overrides, "mona"),
        textInput: createComboBoxTextInputVariants(monaComboBoxTextInputVariants, overrides, "mona")
    };
    const reina: ComboBoxVariantsFunctions = {
        affixContainer: createComboBoxAffixContainerVariants(reinaComboBoxAffixContainerVariants, overrides, "reina"),
        base: createComboBoxBaseVariants(reinaComboBoxBaseVariants, overrides, "reina"),
        textInput: createComboBoxTextInputVariants(reinaComboBoxTextInputVariants, overrides, "reina")
    };
    return createThemeStrategy<ComboBoxVariantsFunctions>({ mona, reina }, mona);
}
