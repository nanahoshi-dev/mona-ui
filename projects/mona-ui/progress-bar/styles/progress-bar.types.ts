import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    progressBarBaseVariants as monaProgressBarBaseVariants,
    progressBarIndeterminateVariants as monaProgressBarIndeterminateVariants,
    progressBarLabelVariants as monaProgressBarLabelVariants,
    progressBarTrackVariants as monaProgressBarTrackVariants
} from "./progress-bar.mona.styles";

export type ProgressBarBaseVariantsFunction = (props?: ProgressBarBaseVariantProps) => string;
export type ProgressBarBaseVariantProps = VariantProps<typeof monaProgressBarBaseVariants>;

export type ProgressBarIndeterminateVariantsFunction = (props?: ProgressBarIndeterminateVariantProps) => string;
export type ProgressBarIndeterminateVariantProps = VariantProps<typeof monaProgressBarIndeterminateVariants>;

export type ProgressBarLabelVariantsFunction = (props?: ProgressBarLabelVariantProps) => string;
export type ProgressBarLabelVariantProps = VariantProps<typeof monaProgressBarLabelVariants>;

export type ProgressBarTrackVariantsFunction = (props?: ProgressBarTrackVariantProps) => string;
export type ProgressBarTrackVariantProps = VariantProps<typeof monaProgressBarTrackVariants>;

export type ProgressBarBaseVariantInput = VariantInputs<ProgressBarBaseVariantProps>;
export type ProgressBarIndeterminateVariantInput = VariantInputs<ProgressBarIndeterminateVariantProps>;
export type ProgressBarLabelVariantInput = VariantInputs<ProgressBarLabelVariantProps>;
export type ProgressBarTrackVariantInput = VariantInputs<ProgressBarTrackVariantProps>;

export type ProgressBarVariantProps = ProgressBarBaseVariantProps &
    ProgressBarIndeterminateVariantProps &
    ProgressBarTrackVariantProps &
    ProgressBarLabelVariantProps;
export type ProgressBarVariantInput = ProgressBarBaseVariantInput &
    ProgressBarIndeterminateVariantInput &
    ProgressBarTrackVariantInput &
    ProgressBarLabelVariantInput;

export interface ProgressBarVariantsFunctions {
    readonly base: ProgressBarBaseVariantsFunction;
    readonly indeterminate: ProgressBarIndeterminateVariantsFunction;
    readonly label: ProgressBarLabelVariantsFunction;
    readonly track: ProgressBarTrackVariantsFunction;
}

export type ProgressBarStyleStrategy = ThemeStrategy<ProgressBarVariantsFunctions>;

export interface ProgressBarBaseCompoundStyleOverride {
    readonly when: Partial<ProgressBarBaseVariantProps>;
    readonly class: ClassValue;
}

export interface ProgressBarBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ProgressBarBaseVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly ProgressBarBaseCompoundStyleOverride[];
}

export interface ProgressBarIndeterminateStyleOverrides {
    readonly base?: ClassValue;
}

export interface ProgressBarLabelStyleOverrides {
    readonly base?: ClassValue;
}

export interface ProgressBarTrackCompoundStyleOverride {
    readonly when: Partial<ProgressBarTrackVariantProps>;
    readonly class: ClassValue;
}

export interface ProgressBarTrackStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ProgressBarTrackVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly ProgressBarTrackCompoundStyleOverride[];
}

export interface ProgressBarStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ProgressBarBaseStyleOverrides;
    readonly indeterminate?: ProgressBarIndeterminateStyleOverrides;
    readonly label?: ProgressBarLabelStyleOverrides;
    readonly track?: ProgressBarTrackStyleOverrides;
}

export type ProgressBarStylesProviderConfig =
    | ProgressBarStyleOverrides
    | { readonly strategy: ProgressBarStyleStrategy };
