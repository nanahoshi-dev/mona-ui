import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    radioButtonCircleVariants as monaRadioButtonCircleVariants,
    radioButtonContainerLabelVariants as monaRadioButtonContainerLabelVariants,
    radioButtonDirectiveVariants as monaRadioButtonDirectiveVariants,
    radioButtonIndicatorVariants as monaRadioButtonIndicatorVariants,
    radioButtonVariants as monaRadioButtonVariants
} from "./radio.mona.styles";

export type RadioButtonVariantsFunction = (props?: RadioButtonHostVariantProps) => string;
export type RadioButtonHostVariantProps = VariantProps<typeof monaRadioButtonVariants>;

export type RadioButtonCircleVariantsFunction = (props?: RadioButtonCircleVariantProps) => string;
export type RadioButtonCircleVariantProps = VariantProps<typeof monaRadioButtonCircleVariants>;

export type RadioButtonIndicatorVariantsFunction = (props?: RadioButtonIndicatorVariantProps) => string;
export type RadioButtonIndicatorVariantProps = VariantProps<typeof monaRadioButtonIndicatorVariants>;

export type RadioButtonContainerLabelVariantsFunction = (props?: RadioButtonContainerLabelVariantProps) => string;
export type RadioButtonContainerLabelVariantProps = VariantProps<typeof monaRadioButtonContainerLabelVariants>;

export type RadioButtonDirectiveVariantsFunction = (props?: RadioButtonDirectiveProps) => string;
export type RadioButtonDirectiveProps = VariantProps<typeof monaRadioButtonDirectiveVariants>;

export type RadioButtonContainerLabelVariantInput = VariantInputs<RadioButtonContainerLabelVariantProps>;
export type RadioButtonCircleVariantInput = VariantInputs<RadioButtonCircleVariantProps>;
export type RadioButtonIndicatorVariantInput = VariantInputs<RadioButtonIndicatorVariantProps>;
export type RadioButtonDirectiveInput = VariantInputs<RadioButtonDirectiveProps>;

export type RadioButtonVariantProps = RadioButtonContainerLabelVariantProps &
    RadioButtonCircleVariantProps &
    RadioButtonIndicatorVariantProps;

export type RadioButtonVariantInput = RadioButtonContainerLabelVariantInput &
    RadioButtonCircleVariantInput &
    RadioButtonIndicatorVariantInput;

export interface RadioButtonVariantsFunctions {
    readonly circle: RadioButtonCircleVariantsFunction;
    readonly containerLabel: RadioButtonContainerLabelVariantsFunction;
    readonly directive: RadioButtonDirectiveVariantsFunction;
    readonly host: RadioButtonVariantsFunction;
    readonly indicator: RadioButtonIndicatorVariantsFunction;
}

export type RadioButtonStyleStrategy = ThemeStrategy<RadioButtonVariantsFunctions>;

export interface RadioButtonHostStyleOverrides {
    readonly base?: ClassValue;
}

export interface RadioButtonCircleCompoundStyleOverride {
    readonly when: Partial<RadioButtonCircleVariantProps>;
    readonly class: ClassValue;
}

export interface RadioButtonCircleStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<RadioButtonCircleVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly RadioButtonCircleCompoundStyleOverride[];
}

export interface RadioButtonIndicatorCompoundStyleOverride {
    readonly when: Partial<RadioButtonIndicatorVariantProps>;
    readonly class: ClassValue;
}

export interface RadioButtonIndicatorStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<RadioButtonIndicatorVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly RadioButtonIndicatorCompoundStyleOverride[];
}

export interface RadioButtonContainerLabelCompoundStyleOverride {
    readonly when: Partial<RadioButtonContainerLabelVariantProps>;
    readonly class: ClassValue;
}

export interface RadioButtonContainerLabelStyleOverrides {
    readonly base?: ClassValue;
    readonly labelSize?: Partial<
        Record<NonNullable<RadioButtonContainerLabelVariantProps["labelSize"]>, ClassValue>
    >;
    readonly compoundVariants?: readonly RadioButtonContainerLabelCompoundStyleOverride[];
}

export interface RadioButtonDirectiveCompoundStyleOverride {
    readonly when: Partial<RadioButtonDirectiveProps>;
    readonly class: ClassValue;
}

export interface RadioButtonDirectiveStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<RadioButtonDirectiveProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly RadioButtonDirectiveCompoundStyleOverride[];
}

export interface RadioButtonStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly circle?: RadioButtonCircleStyleOverrides;
    readonly containerLabel?: RadioButtonContainerLabelStyleOverrides;
    readonly directive?: RadioButtonDirectiveStyleOverrides;
    readonly host?: RadioButtonHostStyleOverrides;
    readonly indicator?: RadioButtonIndicatorStyleOverrides;
}

export type RadioButtonStylesProviderConfig =
    | RadioButtonStyleOverrides
    | { readonly strategy: RadioButtonStyleStrategy };
