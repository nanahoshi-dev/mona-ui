import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    checkboxContainerLabelVariants as monaCheckboxContainerLabelVariants,
    checkboxDirectiveVariants as monaCheckboxDirectiveVariants,
    checkboxVariants as monaCheckboxVariants,
    checkmarkVariants as monaCheckmarkVariants
} from "./checkbox.mona.styles";

export type CheckboxInputVariantsFunction = (props?: CheckboxInputVariantProps) => string;
export type CheckboxInputVariantProps = VariantProps<typeof monaCheckboxVariants>;

export type CheckmarkVariantsFunction = (props?: CheckmarkVariantProps) => string;
export type CheckmarkVariantProps = VariantProps<typeof monaCheckmarkVariants>;

export type CheckboxContainerLabelVariantsFunction = (props?: CheckboxContainerLabelVariantProps) => string;
export type CheckboxContainerLabelVariantProps = VariantProps<typeof monaCheckboxContainerLabelVariants>;

export type CheckboxDirectiveVariantsFunction = (props?: CheckboxDirectiveVariantProps) => string;
export type CheckboxDirectiveVariantProps = VariantProps<typeof monaCheckboxDirectiveVariants>;

export type CheckboxContainerLabelVariantInput = VariantInputs<CheckboxContainerLabelVariantProps>;
export type CheckmarkVariantInput = VariantInputs<CheckmarkVariantProps>;
export type CheckboxDirectiveVariantInput = VariantInputs<CheckboxDirectiveVariantProps>;

export type CheckboxVariantProps = CheckboxContainerLabelVariantProps & CheckmarkVariantProps;
export type CheckboxVariantInput = CheckboxContainerLabelVariantInput & CheckmarkVariantInput;

export interface CheckboxVariantsFunctions {
    readonly containerLabel: CheckboxContainerLabelVariantsFunction;
    readonly directive: CheckboxDirectiveVariantsFunction;
    readonly checkmark: CheckmarkVariantsFunction;
    readonly input: CheckboxInputVariantsFunction;
}

export type CheckboxStyleStrategy = ThemeStrategy<CheckboxVariantsFunctions>;

export interface CheckboxInputStyleOverrides {
    readonly base?: ClassValue;
}

export interface CheckmarkCompoundStyleOverride {
    readonly when: Partial<CheckmarkVariantProps>;
    readonly class: ClassValue;
}

export interface CheckmarkStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<CheckmarkVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly CheckmarkCompoundStyleOverride[];
}

export interface CheckboxContainerLabelCompoundStyleOverride {
    readonly when: Partial<CheckboxContainerLabelVariantProps>;
    readonly class: ClassValue;
}

export interface CheckboxContainerLabelStyleOverrides {
    readonly base?: ClassValue;
    readonly labelSize?: Partial<Record<NonNullable<CheckboxContainerLabelVariantProps["labelSize"]>, ClassValue>>;
    readonly compoundVariants?: readonly CheckboxContainerLabelCompoundStyleOverride[];
}

export interface CheckboxDirectiveCompoundStyleOverride {
    readonly when: Partial<CheckboxDirectiveVariantProps>;
    readonly class: ClassValue;
}

export interface CheckboxDirectiveStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<CheckboxDirectiveVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly CheckboxDirectiveCompoundStyleOverride[];
}

export interface CheckboxStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly containerLabel?: CheckboxContainerLabelStyleOverrides;
    readonly directive?: CheckboxDirectiveStyleOverrides;
    readonly checkmark?: CheckmarkStyleOverrides;
    readonly input?: CheckboxInputStyleOverrides;
}

export type CheckboxStylesProviderConfig = CheckboxStyleOverrides | { readonly strategy: CheckboxStyleStrategy };
