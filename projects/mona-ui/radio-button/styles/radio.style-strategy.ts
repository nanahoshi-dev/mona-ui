import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
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

const defaultRadioButtonHostStrategy = createInheritedThemeStrategy<RadioButtonVariantsFunction>(
    monaRadioButtonVariants,
    { reina: reinaRadioButtonVariants }
);
const defaultRadioButtonCircleStrategy = createInheritedThemeStrategy<RadioButtonCircleVariantsFunction>(
    monaRadioButtonCircleVariants,
    { reina: reinaRadioButtonCircleVariants }
);
const defaultRadioButtonIndicatorStrategy = createInheritedThemeStrategy<RadioButtonIndicatorVariantsFunction>(
    monaRadioButtonIndicatorVariants,
    { reina: reinaRadioButtonIndicatorVariants }
);
const defaultRadioButtonContainerLabelStrategy =
    createInheritedThemeStrategy<RadioButtonContainerLabelVariantsFunction>(monaRadioButtonContainerLabelVariants, {
        reina: reinaRadioButtonContainerLabelVariants
    });
const defaultRadioButtonDirectiveStrategy = createInheritedThemeStrategy<RadioButtonDirectiveVariantsFunction>(
    monaRadioButtonDirectiveVariants,
    { reina: reinaRadioButtonDirectiveVariants }
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
        containerLabel: createRadioButtonContainerLabelVariants(
            monaRadioButtonContainerLabelVariants,
            overrides,
            "mona"
        ),
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
    return createInheritedThemeStrategy<RadioButtonVariantsFunctions>(mona, { reina: reina });
}
