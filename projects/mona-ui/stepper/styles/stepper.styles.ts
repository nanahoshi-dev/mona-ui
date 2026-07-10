import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    stepperBaseVariants as monaStepperBaseVariants,
    stepperStepIndicatorVariants as monaStepperStepIndicatorVariants,
    stepperStepListItemVariants as monaStepperStepListItemVariants,
    stepperStepListVariants as monaStepperStepListVariants,
    stepperTrackLineVariants as monaStepperTrackLineVariants,
    stepperTrackVariants as monaStepperTrackVariants
} from "./stepper.mona.styles";

export const stepperBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaStepperBaseVariants;
        default:
            return monaStepperBaseVariants;
    }
};

export const stepperStepListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaStepperStepListVariants;
        default:
            return monaStepperStepListVariants;
    }
};

export const stepperStepListItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaStepperStepListItemVariants;
        default:
            return monaStepperStepListItemVariants;
    }
};

export const stepperStepIndicatorThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaStepperStepIndicatorVariants;
        default:
            return monaStepperStepIndicatorVariants;
    }
};

export const stepperTrackThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaStepperTrackVariants;
        default:
            return monaStepperTrackVariants;
    }
};

export const stepperTrackLineThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaStepperTrackLineVariants;
        default:
            return monaStepperTrackLineVariants;
    }
};

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
