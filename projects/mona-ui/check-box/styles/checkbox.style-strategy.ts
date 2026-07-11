import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    checkboxContainerLabelVariants as monaCheckboxContainerLabelVariants,
    checkboxDirectiveVariants as monaCheckboxDirectiveVariants,
    checkboxVariants as monaCheckboxVariants,
    checkmarkVariants as monaCheckmarkVariants
} from "./checkbox.mona.styles";
import {
    reinaCheckboxContainerLabelVariants,
    reinaCheckboxDirectiveVariants,
    reinaCheckboxVariants,
    reinaCheckmarkVariants
} from "./checkbox.reina.styles";
import {
    createCheckboxContainerLabelVariants,
    createCheckboxDirectiveVariants,
    createCheckboxInputVariants,
    createCheckmarkVariants
} from "./checkbox.style-composition";
import type {
    CheckboxContainerLabelVariantsFunction,
    CheckboxDirectiveVariantsFunction,
    CheckboxInputVariantsFunction,
    CheckboxStyleOverrides,
    CheckboxStyleStrategy,
    CheckboxVariantsFunctions,
    CheckmarkVariantsFunction
} from "./checkbox.types";

const defaultCheckboxInputStrategy = createThemeStrategy<CheckboxInputVariantsFunction>(
    { mona: monaCheckboxVariants, reina: reinaCheckboxVariants },
    monaCheckboxVariants
);
const defaultCheckmarkStrategy = createThemeStrategy<CheckmarkVariantsFunction>(
    { mona: monaCheckmarkVariants, reina: reinaCheckmarkVariants },
    monaCheckmarkVariants
);
const defaultCheckboxContainerLabelStrategy = createThemeStrategy<CheckboxContainerLabelVariantsFunction>(
    { mona: monaCheckboxContainerLabelVariants, reina: reinaCheckboxContainerLabelVariants },
    monaCheckboxContainerLabelVariants
);
const defaultCheckboxDirectiveStrategy = createThemeStrategy<CheckboxDirectiveVariantsFunction>(
    { mona: monaCheckboxDirectiveVariants, reina: reinaCheckboxDirectiveVariants },
    monaCheckboxDirectiveVariants
);

export const checkboxInputThemeVariants = (theme: ThemeStyle): CheckboxInputVariantsFunction =>
    defaultCheckboxInputStrategy.resolve(theme);
export const checkmarkThemeVariants = (theme: ThemeStyle): CheckmarkVariantsFunction =>
    defaultCheckmarkStrategy.resolve(theme);
export const checkboxContainerLabelThemeVariants = (theme: ThemeStyle): CheckboxContainerLabelVariantsFunction =>
    defaultCheckboxContainerLabelStrategy.resolve(theme);
export const checkboxDirectiveThemeVariants = (theme: ThemeStyle): CheckboxDirectiveVariantsFunction =>
    defaultCheckboxDirectiveStrategy.resolve(theme);

export function createCheckboxStyleStrategy(overrides: readonly CheckboxStyleOverrides[] = []): CheckboxStyleStrategy {
    const mona: CheckboxVariantsFunctions = {
        containerLabel: createCheckboxContainerLabelVariants(monaCheckboxContainerLabelVariants, overrides, "mona"),
        directive: createCheckboxDirectiveVariants(monaCheckboxDirectiveVariants, overrides, "mona"),
        checkmark: createCheckmarkVariants(monaCheckmarkVariants, overrides, "mona"),
        input: createCheckboxInputVariants(monaCheckboxVariants, overrides, "mona")
    };
    const reina: CheckboxVariantsFunctions = {
        containerLabel: createCheckboxContainerLabelVariants(reinaCheckboxContainerLabelVariants, overrides, "reina"),
        directive: createCheckboxDirectiveVariants(reinaCheckboxDirectiveVariants, overrides, "reina"),
        checkmark: createCheckmarkVariants(reinaCheckmarkVariants, overrides, "reina"),
        input: createCheckboxInputVariants(reinaCheckboxVariants, overrides, "reina")
    };
    return createThemeStrategy<CheckboxVariantsFunctions>({ mona, reina }, mona);
}
