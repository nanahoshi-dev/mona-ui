import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    radioButtonCircleVariants as monaRadioButtonCircleVariants,
    radioButtonContainerLabelVariants as monaRadioButtonContainerLabelVariants,
    radioButtonDirectiveVariants as monaRadioButtonDirectiveVariants,
    radioButtonIndicatorVariants as monaRadioButtonIndicatorVariants,
    radioButtonVariants as monaRadioButtonVariants
} from "./radio.mona.styles";
import {
    reinaRadioButtonCircleVariants,
    reinaRadioButtonContainerLabelVariants,
    reinaRadioButtonDirectiveVariants,
    reinaRadioButtonIndicatorVariants,
    reinaRadioButtonVariants
} from "./radio.reina.styles";
import {
    createRadioButtonCircleVariants,
    createRadioButtonContainerLabelVariants,
    createRadioButtonDirectiveVariants,
    createRadioButtonHostVariants,
    createRadioButtonIndicatorVariants
} from "./radio.style-composition";
import type {
    RadioButtonCircleVariantsFunction,
    RadioButtonContainerLabelVariantsFunction,
    RadioButtonDirectiveVariantsFunction,
    RadioButtonIndicatorVariantsFunction,
    RadioButtonStyleOverrides,
    RadioButtonStyleStrategy,
    RadioButtonVariantsFunction,
    RadioButtonVariantsFunctions
} from "./radio.types";

const defaultRadioButtonHostStrategy = createThemeStrategy<RadioButtonVariantsFunction>(
    { mona: monaRadioButtonVariants, reina: reinaRadioButtonVariants },
    monaRadioButtonVariants
);
const defaultRadioButtonCircleStrategy = createThemeStrategy<RadioButtonCircleVariantsFunction>(
    { mona: monaRadioButtonCircleVariants, reina: reinaRadioButtonCircleVariants },
    monaRadioButtonCircleVariants
);
const defaultRadioButtonIndicatorStrategy = createThemeStrategy<RadioButtonIndicatorVariantsFunction>(
    { mona: monaRadioButtonIndicatorVariants, reina: reinaRadioButtonIndicatorVariants },
    monaRadioButtonIndicatorVariants
);
const defaultRadioButtonContainerLabelStrategy = createThemeStrategy<RadioButtonContainerLabelVariantsFunction>(
    { mona: monaRadioButtonContainerLabelVariants, reina: reinaRadioButtonContainerLabelVariants },
    monaRadioButtonContainerLabelVariants
);
const defaultRadioButtonDirectiveStrategy = createThemeStrategy<RadioButtonDirectiveVariantsFunction>(
    { mona: monaRadioButtonDirectiveVariants, reina: reinaRadioButtonDirectiveVariants },
    monaRadioButtonDirectiveVariants
);

export const radioButtonThemeVariants = (theme: ThemeStyle): RadioButtonVariantsFunction =>
    defaultRadioButtonHostStrategy.resolve(theme);
export const radioButtonCircleThemeVariants = (theme: ThemeStyle): RadioButtonCircleVariantsFunction =>
    defaultRadioButtonCircleStrategy.resolve(theme);
export const radioButtonIndicatorThemeVariants = (theme: ThemeStyle): RadioButtonIndicatorVariantsFunction =>
    defaultRadioButtonIndicatorStrategy.resolve(theme);
export const radioButtonContainerLabelThemeVariants = (theme: ThemeStyle): RadioButtonContainerLabelVariantsFunction =>
    defaultRadioButtonContainerLabelStrategy.resolve(theme);
export const radioButtonDirectiveThemeVariants = (theme: ThemeStyle): RadioButtonDirectiveVariantsFunction =>
    defaultRadioButtonDirectiveStrategy.resolve(theme);

export function createRadioButtonStyleStrategy(
    overrides: readonly RadioButtonStyleOverrides[] = []
): RadioButtonStyleStrategy {
    const mona: RadioButtonVariantsFunctions = {
        circle: createRadioButtonCircleVariants(monaRadioButtonCircleVariants, overrides, "mona"),
        containerLabel: createRadioButtonContainerLabelVariants(monaRadioButtonContainerLabelVariants, overrides, "mona"),
        directive: createRadioButtonDirectiveVariants(monaRadioButtonDirectiveVariants, overrides, "mona"),
        host: createRadioButtonHostVariants(monaRadioButtonVariants, overrides, "mona"),
        indicator: createRadioButtonIndicatorVariants(monaRadioButtonIndicatorVariants, overrides, "mona")
    };
    const reina: RadioButtonVariantsFunctions = {
        circle: createRadioButtonCircleVariants(reinaRadioButtonCircleVariants, overrides, "reina"),
        containerLabel: createRadioButtonContainerLabelVariants(
            reinaRadioButtonContainerLabelVariants,
            overrides,
            "reina"
        ),
        directive: createRadioButtonDirectiveVariants(reinaRadioButtonDirectiveVariants, overrides, "reina"),
        host: createRadioButtonHostVariants(reinaRadioButtonVariants, overrides, "reina"),
        indicator: createRadioButtonIndicatorVariants(reinaRadioButtonIndicatorVariants, overrides, "reina")
    };
    return createThemeStrategy<RadioButtonVariantsFunctions>({ mona, reina }, mona);
}
