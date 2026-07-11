import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    stepperBaseVariants as monaStepperBaseVariants,
    stepperStepIndicatorVariants as monaStepperStepIndicatorVariants,
    stepperStepListItemVariants as monaStepperStepListItemVariants,
    stepperStepListVariants as monaStepperStepListVariants,
    stepperTrackLineVariants as monaStepperTrackLineVariants,
    stepperTrackVariants as monaStepperTrackVariants
} from "./stepper.mona.styles";
import {
    reinaStepperBaseVariants,
    reinaStepperStepIndicatorVariants,
    reinaStepperStepListItemVariants,
    reinaStepperStepListVariants,
    reinaStepperTrackLineVariants,
    reinaStepperTrackVariants
} from "./stepper.reina.styles";
import {
    createStepperBaseVariants,
    createStepperStepIndicatorVariants,
    createStepperStepListItemVariants,
    createStepperStepListVariants,
    createStepperTrackLineVariants,
    createStepperTrackVariants
} from "./stepper.style-composition";
import type {
    StepperBaseVariantsFunction,
    StepperStepIndicatorVariantsFunction,
    StepperStepListItemVariantsFunction,
    StepperStepListVariantsFunction,
    StepperStyleOverrides,
    StepperStyleStrategy,
    StepperTrackLineVariantsFunction,
    StepperTrackVariantsFunction,
    StepperVariantsFunctions
} from "./stepper.types";

const defaultStepperBaseStrategy = createThemeStrategy<StepperBaseVariantsFunction>(
    { mona: monaStepperBaseVariants, reina: reinaStepperBaseVariants },
    monaStepperBaseVariants
);
const defaultStepperStepListStrategy = createThemeStrategy<StepperStepListVariantsFunction>(
    { mona: monaStepperStepListVariants, reina: reinaStepperStepListVariants },
    monaStepperStepListVariants
);
const defaultStepperStepListItemStrategy = createThemeStrategy<StepperStepListItemVariantsFunction>(
    { mona: monaStepperStepListItemVariants, reina: reinaStepperStepListItemVariants },
    monaStepperStepListItemVariants
);
const defaultStepperStepIndicatorStrategy = createThemeStrategy<StepperStepIndicatorVariantsFunction>(
    { mona: monaStepperStepIndicatorVariants, reina: reinaStepperStepIndicatorVariants },
    monaStepperStepIndicatorVariants
);
const defaultStepperTrackStrategy = createThemeStrategy<StepperTrackVariantsFunction>(
    { mona: monaStepperTrackVariants, reina: reinaStepperTrackVariants },
    monaStepperTrackVariants
);
const defaultStepperTrackLineStrategy = createThemeStrategy<StepperTrackLineVariantsFunction>(
    { mona: monaStepperTrackLineVariants, reina: reinaStepperTrackLineVariants },
    monaStepperTrackLineVariants
);

export const stepperBaseThemeVariants = (theme: ThemeStyle): StepperBaseVariantsFunction =>
    defaultStepperBaseStrategy.resolve(theme);
export const stepperStepListThemeVariants = (theme: ThemeStyle): StepperStepListVariantsFunction =>
    defaultStepperStepListStrategy.resolve(theme);
export const stepperStepListItemThemeVariants = (theme: ThemeStyle): StepperStepListItemVariantsFunction =>
    defaultStepperStepListItemStrategy.resolve(theme);
export const stepperStepIndicatorThemeVariants = (theme: ThemeStyle): StepperStepIndicatorVariantsFunction =>
    defaultStepperStepIndicatorStrategy.resolve(theme);
export const stepperTrackThemeVariants = (theme: ThemeStyle): StepperTrackVariantsFunction =>
    defaultStepperTrackStrategy.resolve(theme);
export const stepperTrackLineThemeVariants = (theme: ThemeStyle): StepperTrackLineVariantsFunction =>
    defaultStepperTrackLineStrategy.resolve(theme);

export function createStepperStyleStrategy(overrides: readonly StepperStyleOverrides[] = []): StepperStyleStrategy {
    const mona: StepperVariantsFunctions = {
        base: createStepperBaseVariants(monaStepperBaseVariants, overrides, "mona"),
        stepIndicator: createStepperStepIndicatorVariants(monaStepperStepIndicatorVariants, overrides, "mona"),
        stepList: createStepperStepListVariants(monaStepperStepListVariants, overrides, "mona"),
        stepListItem: createStepperStepListItemVariants(monaStepperStepListItemVariants, overrides, "mona"),
        track: createStepperTrackVariants(monaStepperTrackVariants, overrides, "mona"),
        trackLine: createStepperTrackLineVariants(monaStepperTrackLineVariants, overrides, "mona")
    };
    const reina: StepperVariantsFunctions = {
        base: createStepperBaseVariants(reinaStepperBaseVariants, overrides, "reina"),
        stepIndicator: createStepperStepIndicatorVariants(reinaStepperStepIndicatorVariants, overrides, "reina"),
        stepList: createStepperStepListVariants(reinaStepperStepListVariants, overrides, "reina"),
        stepListItem: createStepperStepListItemVariants(reinaStepperStepListItemVariants, overrides, "reina"),
        track: createStepperTrackVariants(reinaStepperTrackVariants, overrides, "reina"),
        trackLine: createStepperTrackLineVariants(reinaStepperTrackLineVariants, overrides, "reina")
    };
    return createThemeStrategy<StepperVariantsFunctions>({ mona, reina }, mona);
}
