/*
 * Public API Surface of @nanahoshi/mona-ui/slider
 */

export * from "./components/slider/slider.component";
export * from "./components/range-slider/range-slider.component";

export * from "./directives/slider-handle-template.directive";
export * from "./directives/slider-tick-value-template.directive";

export {
    createSliderStyleStrategy,
    provideSliderStyles,
    SLIDER_STYLE_OVERRIDES,
    SLIDER_STYLE_STRATEGY
} from "./styles/slider.styles";
export type {
    SliderBaseStyleOverrides,
    SliderBaseVariantInput,
    SliderBaseVariantProps,
    SliderHandleCompoundStyleOverride,
    SliderHandleStyleOverrides,
    SliderHandleVariantInput,
    SliderHandleVariantProps,
    SliderSelectionStyleOverrides,
    SliderSelectionVariantInput,
    SliderSelectionVariantProps,
    SliderStyleOverrides,
    SliderStylesProviderConfig,
    SliderStyleStrategy,
    SliderTickLabelListStyleOverrides,
    SliderTickLabelListVariantInput,
    SliderTickLabelListVariantProps,
    SliderTickLabelStyleOverrides,
    SliderTickLabelVariantInput,
    SliderTickLabelVariantProps,
    SliderTickListStyleOverrides,
    SliderTickListVariantInput,
    SliderTickListVariantProps,
    SliderTickStyleOverrides,
    SliderTickVariantInput,
    SliderTickVariantProps,
    SliderTrackStyleOverrides,
    SliderTrackVariantInput,
    SliderTrackVariantProps,
    SliderVariantInput,
    SliderVariantProps,
    SliderVariantsFunctions
} from "./styles/slider.styles";
