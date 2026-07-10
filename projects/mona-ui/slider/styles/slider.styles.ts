import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
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

const sliderBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaSliderBaseVariants }, monaSliderBaseVariants);

export const sliderBaseThemeVariants = (theme: ThemeStyle) => sliderBaseThemeVariantsStrategy.resolve(theme);

const sliderTrackThemeVariantsStrategy = createThemeStrategy(
    { mona: monaSliderTrackVariants },
    monaSliderTrackVariants
);

export const sliderTrackThemeVariants = (theme: ThemeStyle) => sliderTrackThemeVariantsStrategy.resolve(theme);

const sliderSelectionThemeVariantsStrategy = createThemeStrategy(
    { mona: monaSliderSelectionVariants },
    monaSliderSelectionVariants
);

export const sliderSelectionThemeVariants = (theme: ThemeStyle) => sliderSelectionThemeVariantsStrategy.resolve(theme);

const sliderTickListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaSliderTickListVariants },
    monaSliderTickListVariants
);

export const sliderTickListThemeVariants = (theme: ThemeStyle) => sliderTickListThemeVariantsStrategy.resolve(theme);

const sliderTickThemeVariantsStrategy = createThemeStrategy({ mona: monaSliderTickVariants }, monaSliderTickVariants);

export const sliderTickThemeVariants = (theme: ThemeStyle) => sliderTickThemeVariantsStrategy.resolve(theme);

const sliderTickLabelListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaSliderTickLabelListVariants },
    monaSliderTickLabelListVariants
);

export const sliderTickLabelListThemeVariants = (theme: ThemeStyle) =>
    sliderTickLabelListThemeVariantsStrategy.resolve(theme);

const sliderTickLabelThemeVariantsStrategy = createThemeStrategy(
    { mona: monaSliderTickLabelVariants },
    monaSliderTickLabelVariants
);

export const sliderTickLabelThemeVariants = (theme: ThemeStyle) => sliderTickLabelThemeVariantsStrategy.resolve(theme);

const sliderHandleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaSliderHandleVariants },
    monaSliderHandleVariants
);

export const sliderHandleThemeVariants = (theme: ThemeStyle) => sliderHandleThemeVariantsStrategy.resolve(theme);

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
