import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    sliderBaseVariants as monaSliderBaseVariants,
    sliderHandleVariants as monaSliderHandleVariants,
    sliderSelectionVariants as monaSliderSelectionVariants,
    sliderTickLabelListVariants as monaSliderTickLabelListVariants,
    sliderTickLabelVariants as monaSliderTickLabelVariants,
    sliderTickListVariants as monaSliderTickListVariants,
    sliderTickVariants as monaSliderTickVariants,
    sliderTrackVariants as monaSliderTrackVariants
} from "./slider.mona.styles";

export type SliderBaseVariantsFunction = (props?: SliderBaseVariantProps) => string;
export type SliderBaseVariantProps = VariantProps<typeof monaSliderBaseVariants>;

export type SliderTrackVariantsFunction = (props?: SliderTrackVariantProps) => string;
export type SliderTrackVariantProps = VariantProps<typeof monaSliderTrackVariants>;

export type SliderSelectionVariantsFunction = (props?: SliderSelectionVariantProps) => string;
export type SliderSelectionVariantProps = VariantProps<typeof monaSliderSelectionVariants>;

export type SliderTickListVariantsFunction = (props?: SliderTickListVariantProps) => string;
export type SliderTickListVariantProps = VariantProps<typeof monaSliderTickListVariants>;

export type SliderTickVariantsFunction = (props?: SliderTickVariantProps) => string;
export type SliderTickVariantProps = VariantProps<typeof monaSliderTickVariants>;

export type SliderTickLabelListVariantsFunction = (props?: SliderTickLabelListVariantProps) => string;
export type SliderTickLabelListVariantProps = VariantProps<typeof monaSliderTickLabelListVariants>;

export type SliderTickLabelVariantsFunction = (props?: SliderTickLabelVariantProps) => string;
export type SliderTickLabelVariantProps = VariantProps<typeof monaSliderTickLabelVariants>;

export type SliderHandleVariantsFunction = (props?: SliderHandleVariantProps) => string;
export type SliderHandleVariantProps = VariantProps<typeof monaSliderHandleVariants>;

export type SliderBaseVariantInput = VariantInputs<SliderBaseVariantProps>;
export type SliderTrackVariantInput = VariantInputs<SliderTrackVariantProps>;
export type SliderSelectionVariantInput = VariantInputs<SliderSelectionVariantProps>;
export type SliderTickListVariantInput = VariantInputs<SliderTickListVariantProps>;
export type SliderTickVariantInput = VariantInputs<SliderTickVariantProps>;
export type SliderTickLabelListVariantInput = VariantInputs<SliderTickLabelListVariantProps>;
export type SliderTickLabelVariantInput = VariantInputs<SliderTickLabelVariantProps>;
export type SliderHandleVariantInput = VariantInputs<SliderHandleVariantProps>;

export type SliderVariantProps = SliderBaseVariantProps &
    SliderTrackVariantProps &
    SliderSelectionVariantProps &
    SliderTickListVariantProps &
    SliderTickVariantProps &
    SliderTickLabelListVariantProps &
    SliderTickLabelVariantProps &
    SliderHandleVariantProps;

export type SliderVariantInput = SliderBaseVariantInput &
    SliderTrackVariantInput &
    SliderSelectionVariantInput &
    SliderTickListVariantInput &
    SliderTickVariantInput &
    SliderTickLabelListVariantInput &
    SliderTickLabelVariantInput &
    SliderHandleVariantInput;

export interface SliderVariantsFunctions {
    readonly base: SliderBaseVariantsFunction;
    readonly handle: SliderHandleVariantsFunction;
    readonly selection: SliderSelectionVariantsFunction;
    readonly tick: SliderTickVariantsFunction;
    readonly tickLabel: SliderTickLabelVariantsFunction;
    readonly tickLabelList: SliderTickLabelListVariantsFunction;
    readonly tickList: SliderTickListVariantsFunction;
    readonly track: SliderTrackVariantsFunction;
}

export type SliderStyleStrategy = ThemeStrategy<SliderVariantsFunctions>;

export interface SliderBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface SliderTrackStyleOverrides {
    readonly base?: ClassValue;
}

export interface SliderSelectionStyleOverrides {
    readonly base?: ClassValue;
}

export interface SliderTickListStyleOverrides {
    readonly base?: ClassValue;
}

export interface SliderTickStyleOverrides {
    readonly base?: ClassValue;
}

export interface SliderTickLabelListStyleOverrides {
    readonly base?: ClassValue;
}

export interface SliderTickLabelStyleOverrides {
    readonly base?: ClassValue;
}

export interface SliderHandleCompoundStyleOverride {
    readonly when: Partial<SliderHandleVariantProps>;
    readonly class: ClassValue;
}

export interface SliderHandleStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<SliderHandleVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly SliderHandleCompoundStyleOverride[];
}

export interface SliderStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: SliderBaseStyleOverrides;
    readonly handle?: SliderHandleStyleOverrides;
    readonly selection?: SliderSelectionStyleOverrides;
    readonly tick?: SliderTickStyleOverrides;
    readonly tickLabel?: SliderTickLabelStyleOverrides;
    readonly tickLabelList?: SliderTickLabelListStyleOverrides;
    readonly tickList?: SliderTickListStyleOverrides;
    readonly track?: SliderTrackStyleOverrides;
}

export type SliderStylesProviderConfig = SliderStyleOverrides | { readonly strategy: SliderStyleStrategy };
