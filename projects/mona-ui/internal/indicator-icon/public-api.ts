/*
 * Public API Surface of @nanahoshi/mona-ui/indicator-icon
 */

export * from "./components/indicator-icon/indicator-icon.component";

export {
    createIndicatorIconStyleStrategy,
    INDICATOR_ICON_STYLE_OVERRIDES,
    INDICATOR_ICON_STYLE_STRATEGY,
    provideIndicatorIconStyles
} from "./styles/indicator-icon.styles";
export type {
    IndicatorIconHostStyleOverrides,
    IndicatorIconHostVariantProps,
    IndicatorIconHostVariantsFunction,
    IndicatorIconStyleOverrides,
    IndicatorIconStyleStrategy,
    IndicatorIconStylesProviderConfig,
    IndicatorIconSvgStyleOverrides,
    IndicatorIconSvgVariantProps,
    IndicatorIconSvgVariantsFunction,
    IndicatorIconVariantsFunctions
} from "./styles/indicator-icon.styles";
