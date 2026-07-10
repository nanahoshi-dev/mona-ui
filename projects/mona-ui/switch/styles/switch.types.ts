import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    switchHandleVariants as monaSwitchHandleVariants,
    switchLabelVariants as monaSwitchLabelVariants,
    switchVariants as monaSwitchVariants
} from "./switch.mona.styles";

export type SwitchTrackVariantsFunction = (props?: SwitchTrackVariantProps) => string;
export type SwitchTrackVariantProps = VariantProps<typeof monaSwitchVariants>;

export type SwitchHandleVariantsFunction = (props?: SwitchHandleVariantProps) => string;
export type SwitchHandleVariantProps = VariantProps<typeof monaSwitchHandleVariants>;

export type SwitchLabelVariantsFunction = (props?: SwitchLabelVariantProps) => string;
export type SwitchLabelVariantProps = VariantProps<typeof monaSwitchLabelVariants>;

export type SwitchVariantProps = SwitchTrackVariantProps & SwitchHandleVariantProps & SwitchLabelVariantProps;
export type SwitchVariantInputs = VariantInputs<SwitchVariantProps>;

export interface SwitchVariantsFunctions {
    readonly track: SwitchTrackVariantsFunction;
    readonly handle: SwitchHandleVariantsFunction;
    readonly label: SwitchLabelVariantsFunction;
}

export type SwitchStyleStrategy = ThemeStrategy<SwitchVariantsFunctions>;

export interface SwitchTrackCompoundStyleOverride {
    readonly when: Partial<SwitchTrackVariantProps>;
    readonly class: ClassValue;
}

export interface SwitchTrackStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<SwitchTrackVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<SwitchTrackVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly SwitchTrackCompoundStyleOverride[];
}

export interface SwitchHandleCompoundStyleOverride {
    readonly when: Partial<SwitchHandleVariantProps>;
    readonly class: ClassValue;
}

export interface SwitchHandleStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<SwitchHandleVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<SwitchHandleVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly SwitchHandleCompoundStyleOverride[];
}

export interface SwitchLabelStyleOverrides {
    readonly base?: ClassValue;
}

export interface SwitchStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly track?: SwitchTrackStyleOverrides;
    readonly handle?: SwitchHandleStyleOverrides;
    readonly label?: SwitchLabelStyleOverrides;
}

export type SwitchStylesProviderConfig = SwitchStyleOverrides | { readonly strategy: SwitchStyleStrategy };
