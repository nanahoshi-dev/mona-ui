import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    stepperBaseVariants as monaStepperBaseVariants,
    stepperStepIndicatorVariants as monaStepperStepIndicatorVariants,
    stepperStepListItemVariants as monaStepperStepListItemVariants,
    stepperStepListVariants as monaStepperStepListVariants,
    stepperTrackLineVariants as monaStepperTrackLineVariants,
    stepperTrackVariants as monaStepperTrackVariants
} from "./stepper.mona.styles";

const stepperBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaStepperBaseVariants },
    monaStepperBaseVariants
);

export const stepperBaseThemeVariants = (theme: ThemeStyle) => stepperBaseThemeVariantsStrategy.resolve(theme);

const stepperStepListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaStepperStepListVariants },
    monaStepperStepListVariants
);

export const stepperStepListThemeVariants = (theme: ThemeStyle) => stepperStepListThemeVariantsStrategy.resolve(theme);

const stepperStepListItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaStepperStepListItemVariants },
    monaStepperStepListItemVariants
);

export const stepperStepListItemThemeVariants = (theme: ThemeStyle) =>
    stepperStepListItemThemeVariantsStrategy.resolve(theme);

const stepperStepIndicatorThemeVariantsStrategy = createThemeStrategy(
    { mona: monaStepperStepIndicatorVariants },
    monaStepperStepIndicatorVariants
);

export const stepperStepIndicatorThemeVariants = (theme: ThemeStyle) =>
    stepperStepIndicatorThemeVariantsStrategy.resolve(theme);

const stepperTrackThemeVariantsStrategy = createThemeStrategy(
    { mona: monaStepperTrackVariants },
    monaStepperTrackVariants
);

export const stepperTrackThemeVariants = (theme: ThemeStyle) => stepperTrackThemeVariantsStrategy.resolve(theme);

const stepperTrackLineThemeVariantsStrategy = createThemeStrategy(
    { mona: monaStepperTrackLineVariants },
    monaStepperTrackLineVariants
);

export const stepperTrackLineThemeVariants = (theme: ThemeStyle) =>
    stepperTrackLineThemeVariantsStrategy.resolve(theme);

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
