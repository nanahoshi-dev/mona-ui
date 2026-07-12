import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
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

const defaultCheckboxInputStrategy = createInheritedThemeStrategy<CheckboxInputVariantsFunction>(monaCheckboxVariants, {
    reina: reinaCheckboxVariants
});
const defaultCheckmarkStrategy = createInheritedThemeStrategy<CheckmarkVariantsFunction>(monaCheckmarkVariants, {
    reina: reinaCheckmarkVariants
});
const defaultCheckboxContainerLabelStrategy = createInheritedThemeStrategy<CheckboxContainerLabelVariantsFunction>(
    monaCheckboxContainerLabelVariants,
    { reina: reinaCheckboxContainerLabelVariants }
);
const defaultCheckboxDirectiveStrategy = createInheritedThemeStrategy<CheckboxDirectiveVariantsFunction>(
    monaCheckboxDirectiveVariants,
    { reina: reinaCheckboxDirectiveVariants }
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
    return createInheritedThemeStrategy<CheckboxVariantsFunctions>(mona, { reina: reina });
}
