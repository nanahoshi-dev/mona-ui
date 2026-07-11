import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    stepperBaseVariants as monaStepperBaseVariants,
    stepperStepIndicatorVariants as monaStepperStepIndicatorVariants,
    stepperStepListItemVariants as monaStepperStepListItemVariants,
    stepperStepListVariants as monaStepperStepListVariants,
    stepperTrackLineVariants as monaStepperTrackLineVariants,
    stepperTrackVariants as monaStepperTrackVariants
} from "./stepper.mona.styles";

export type StepperBaseVariantsFunction = (props?: StepperBaseVariantProps) => string;
export type StepperBaseVariantProps = VariantProps<typeof monaStepperBaseVariants>;

export type StepperStepListVariantsFunction = (props?: StepperStepListVariantProps) => string;
export type StepperStepListVariantProps = VariantProps<typeof monaStepperStepListVariants>;

export type StepperStepListItemVariantsFunction = (props?: StepperStepListItemVariantProps) => string;
export type StepperStepListItemVariantProps = VariantProps<typeof monaStepperStepListItemVariants>;

export type StepperStepIndicatorVariantsFunction = (props?: StepperStepIndicatorVariantProps) => string;
export type StepperStepIndicatorVariantProps = VariantProps<typeof monaStepperStepIndicatorVariants>;

export type StepperTrackVariantsFunction = (props?: StepperTrackVariantProps) => string;
export type StepperTrackVariantProps = VariantProps<typeof monaStepperTrackVariants>;

export type StepperTrackLineVariantsFunction = (props?: StepperTrackLineVariantProps) => string;
export type StepperTrackLineVariantProps = VariantProps<typeof monaStepperTrackLineVariants>;

export type StepperBaseVariantInput = VariantInputs<StepperBaseVariantProps>;
export type StepperStepListVariantInput = VariantInputs<StepperStepListVariantProps>;
export type StepperStepListItemVariantInput = VariantInputs<StepperStepListItemVariantProps>;
export type StepperStepIndicatorVariantInput = VariantInputs<StepperStepIndicatorVariantProps>;
export type StepperTrackVariantInput = VariantInputs<StepperTrackVariantProps>;
export type StepperTrackLineVariantInput = VariantInputs<StepperTrackLineVariantProps>;

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

export interface StepperVariantsFunctions {
    readonly base: StepperBaseVariantsFunction;
    readonly stepIndicator: StepperStepIndicatorVariantsFunction;
    readonly stepList: StepperStepListVariantsFunction;
    readonly stepListItem: StepperStepListItemVariantsFunction;
    readonly track: StepperTrackVariantsFunction;
    readonly trackLine: StepperTrackLineVariantsFunction;
}

export type StepperStyleStrategy = ThemeStrategy<StepperVariantsFunctions>;

export interface StepperBaseCompoundStyleOverride {
    readonly when: Partial<StepperBaseVariantProps>;
    readonly class: ClassValue;
}

export interface StepperBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly orientation?: Partial<Record<NonNullable<StepperBaseVariantProps["orientation"]>, ClassValue>>;
    readonly compoundVariants?: readonly StepperBaseCompoundStyleOverride[];
}

export interface StepperStepListCompoundStyleOverride {
    readonly when: Partial<StepperStepListVariantProps>;
    readonly class: ClassValue;
}

export interface StepperStepListStyleOverrides {
    readonly base?: ClassValue;
    readonly orientation?: Partial<Record<NonNullable<StepperStepListVariantProps["orientation"]>, ClassValue>>;
    readonly compoundVariants?: readonly StepperStepListCompoundStyleOverride[];
}

export interface StepperStepListItemCompoundStyleOverride {
    readonly when: Partial<StepperStepListItemVariantProps>;
    readonly class: ClassValue;
}

export interface StepperStepListItemStyleOverrides {
    readonly base?: ClassValue;
    readonly orientation?: Partial<Record<NonNullable<StepperStepListItemVariantProps["orientation"]>, ClassValue>>;
    readonly compoundVariants?: readonly StepperStepListItemCompoundStyleOverride[];
}

export interface StepperStepIndicatorCompoundStyleOverride {
    readonly when: Partial<StepperStepIndicatorVariantProps>;
    readonly class: ClassValue;
}

export interface StepperStepIndicatorStyleOverrides {
    readonly base?: ClassValue;
    readonly active?: Partial<Record<`${NonNullable<StepperStepIndicatorVariantProps["active"]>}`, ClassValue>>;
    readonly focused?: Partial<Record<`${NonNullable<StepperStepIndicatorVariantProps["focused"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<StepperStepIndicatorVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly StepperStepIndicatorCompoundStyleOverride[];
}

export interface StepperTrackCompoundStyleOverride {
    readonly when: Partial<StepperTrackVariantProps>;
    readonly class: ClassValue;
}

export interface StepperTrackStyleOverrides {
    readonly base?: ClassValue;
    readonly orientation?: Partial<Record<NonNullable<StepperTrackVariantProps["orientation"]>, ClassValue>>;
    readonly compoundVariants?: readonly StepperTrackCompoundStyleOverride[];
}

export interface StepperTrackLineCompoundStyleOverride {
    readonly when: Partial<StepperTrackLineVariantProps>;
    readonly class: ClassValue;
}

export interface StepperTrackLineStyleOverrides {
    readonly base?: ClassValue;
    readonly orientation?: Partial<Record<NonNullable<StepperTrackLineVariantProps["orientation"]>, ClassValue>>;
    readonly compoundVariants?: readonly StepperTrackLineCompoundStyleOverride[];
}

export interface StepperStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: StepperBaseStyleOverrides;
    readonly stepIndicator?: StepperStepIndicatorStyleOverrides;
    readonly stepList?: StepperStepListStyleOverrides;
    readonly stepListItem?: StepperStepListItemStyleOverrides;
    readonly track?: StepperTrackStyleOverrides;
    readonly trackLine?: StepperTrackLineStyleOverrides;
}

export type StepperStylesProviderConfig = StepperStyleOverrides | { readonly strategy: StepperStyleStrategy };
