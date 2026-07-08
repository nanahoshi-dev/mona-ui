import { VariantInputs } from "@mirei/mona-ui/common";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    sliderBaseVariants as monaSliderBaseVariants,
    sliderHandleVariants as monaSliderHandleVariants,
    sliderSelectionVariants as monaSliderSelectionVariants,
    sliderTickLabelListVariants as monaSliderTickLabelListVariants,
    sliderTickLabelVariants as monaSliderTickLabelVariants,
    sliderTickListVariants as monaSliderTickListVariants,
    sliderTickVariants as monaSliderTickVariants,
    sliderTrackVariants as monaSliderTrackVariants
} from "./slider.mona.styles";

export const sliderBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSliderBaseVariants;
        default:
            return monaSliderBaseVariants; // Default to Mona styles
    }
};

export const sliderTrackThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSliderTrackVariants;
        default:
            return monaSliderTrackVariants; // Default to Mona styles
    }
};

export const sliderSelectionThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSliderSelectionVariants;
        default:
            return monaSliderSelectionVariants; // Default to Mona styles
    }
};

export const sliderTickListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSliderTickListVariants;
        default:
            return monaSliderTickListVariants; // Default to Mona styles
    }
};

export const sliderTickThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSliderTickVariants;
        default:
            return monaSliderTickVariants; // Default to Mona styles
    }
};

export const sliderTickLabelListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSliderTickLabelListVariants;
        default:
            return monaSliderTickLabelListVariants; // Default to Mona styles
    }
};

export const sliderTickLabelThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSliderTickLabelVariants;
        default:
            return monaSliderTickLabelVariants; // Default to Mona styles
    }
};

export const sliderHandleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSliderHandleVariants;
        default:
            return monaSliderHandleVariants; // Default to Mona styles
    }
};

export type SliderBaseVariantProps = VariantProps<ReturnType<typeof sliderBaseThemeVariants>>;
export type SliderBaseVariantInputs = VariantInputs<SliderBaseVariantProps>;

export type SliderTrackVariantProps = VariantProps<ReturnType<typeof sliderTrackThemeVariants>>;
export type SliderTrackVariantInputs = VariantInputs<SliderTrackVariantProps>;

export type SliderSelectionVariantProps = VariantProps<ReturnType<typeof sliderSelectionThemeVariants>>;
export type SliderSelectionVariantInputs = VariantInputs<SliderSelectionVariantProps>;

export type SliderTickListVariantProps = VariantProps<ReturnType<typeof sliderTickListThemeVariants>>;
export type SliderTickListVariantInputs = VariantInputs<SliderTickListVariantProps>;

export type SliderTickVariantProps = VariantProps<ReturnType<typeof sliderTickThemeVariants>>;
export type SliderTickVariantInputs = VariantInputs<SliderTickVariantProps>;

export type SliderTickLabelListVariantProps = VariantProps<ReturnType<typeof sliderTickLabelListThemeVariants>>;
export type SliderTickLabelListVariantInputs = VariantInputs<SliderTickLabelListVariantProps>;

export type SliderTickLabelVariantProps = VariantProps<ReturnType<typeof sliderTickLabelThemeVariants>>;
export type SliderTickLabelVariantInputs = VariantInputs<SliderTickLabelVariantProps>;

export type SliderHandleVariantProps = VariantProps<ReturnType<typeof sliderHandleThemeVariants>>;
export type SliderHandleVariantInputs = VariantInputs<SliderHandleVariantProps>;

export type SliderVariantProps = SliderBaseVariantProps &
    SliderTrackVariantProps &
    SliderSelectionVariantProps &
    SliderTickListVariantProps &
    SliderTickVariantProps &
    SliderTickLabelListVariantProps &
    SliderTickLabelVariantProps &
    SliderHandleVariantProps;

export type SliderVariantInputs = SliderBaseVariantInputs &
    SliderTrackVariantInputs &
    SliderSelectionVariantInputs &
    SliderTickListVariantInputs &
    SliderTickVariantInputs &
    SliderTickLabelListVariantInputs &
    SliderTickLabelVariantInputs &
    SliderHandleVariantInputs;
