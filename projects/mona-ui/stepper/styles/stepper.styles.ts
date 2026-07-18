import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    stepperBaseVariants as annaStepperBaseVariants,
    stepperStepIndicatorVariants as annaStepperStepIndicatorVariants,
    stepperStepListItemVariants as annaStepperStepListItemVariants,
    stepperStepListVariants as annaStepperStepListVariants,
    stepperTrackLineVariants as annaStepperTrackLineVariants,
    stepperTrackVariants as annaStepperTrackVariants
} from "./stepper.anna.styles";
import {
    stepperBaseVariants as monaStepperBaseVariants,
    stepperStepIndicatorVariants as monaStepperStepIndicatorVariants,
    stepperStepListItemVariants as monaStepperStepListItemVariants,
    stepperStepListVariants as monaStepperStepListVariants,
    stepperTrackLineVariants as monaStepperTrackLineVariants,
    stepperTrackVariants as monaStepperTrackVariants
} from "./stepper.mona.styles";

export const stepperBaseThemeVariants = createThemeStrategy({
    anna: annaStepperBaseVariants,
    mona: monaStepperBaseVariants
});

export const stepperStepListThemeVariants = createThemeStrategy({
    anna: annaStepperStepListVariants,
    mona: monaStepperStepListVariants
});

export const stepperStepListItemThemeVariants = createThemeStrategy({
    anna: annaStepperStepListItemVariants,
    mona: monaStepperStepListItemVariants
});

export const stepperStepIndicatorThemeVariants = createThemeStrategy({
    anna: annaStepperStepIndicatorVariants,
    mona: monaStepperStepIndicatorVariants
});

export const stepperTrackThemeVariants = createThemeStrategy({
    anna: annaStepperTrackVariants,
    mona: monaStepperTrackVariants
});

export const stepperTrackLineThemeVariants = createThemeStrategy({
    anna: annaStepperTrackLineVariants,
    mona: monaStepperTrackLineVariants
});

type StepperBaseVariantProps = VariantProps<ReturnType<typeof stepperBaseThemeVariants>>;
type StepperBaseVariantInput = VariantInputs<StepperBaseVariantProps>;

type StepperStepListVariantProps = VariantProps<ReturnType<typeof stepperStepListThemeVariants>>;
type StepperStepListVariantInput = VariantInputs<StepperStepListVariantProps>;

type StepperStepListItemVariantProps = VariantProps<ReturnType<typeof stepperStepListItemThemeVariants>>;
type StepperStepListItemVariantInput = VariantInputs<StepperStepListItemVariantProps>;

type StepperStepIndicatorVariantProps = VariantProps<ReturnType<typeof stepperStepIndicatorThemeVariants>>;
type StepperStepIndicatorVariantInput = VariantInputs<StepperStepIndicatorVariantProps>;

type StepperTrackVariantProps = VariantProps<ReturnType<typeof stepperTrackThemeVariants>>;
type StepperTrackVariantInput = VariantInputs<StepperTrackVariantProps>;

type StepperTrackLineVariantProps = VariantProps<ReturnType<typeof stepperTrackLineThemeVariants>>;
type StepperTrackLineVariantInput = VariantInputs<StepperTrackLineVariantProps>;

export type StepperVariantProps = StepperBaseVariantProps &
    StepperStepListVariantProps &
    StepperStepListItemVariantProps &
    StepperStepIndicatorVariantProps &
    StepperTrackVariantProps &
    StepperTrackLineVariantProps;
export type StepperVariantInput = StepperBaseVariantInput &
    StepperStepListVariantInput &
    StepperStepListItemVariantInput &
    Omit<StepperStepIndicatorVariantInput, "active" | "focused"> &
    StepperTrackVariantInput &
    StepperTrackLineVariantInput;
