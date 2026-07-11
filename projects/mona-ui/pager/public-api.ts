/*
 * Public API Surface of @nanahoshi/mona-ui/pager
 */

export * from "./components/pager/pager.component";

export * from "./directives/pager-info-template.directive";
export * from "./directives/pager-numeric-buttons-template.directive";
export * from "./directives/pager-navigation-buttons-template.directive";
export * from "./directives/pager-page-size-template.directive";

export * from "./models/PageChangeEvent";
export * from "./models/PageSizeChangeEvent";

export {
    createPagerStyleStrategy,
    PAGER_STYLE_OVERRIDES,
    PAGER_STYLE_STRATEGY,
    providePagerStyles
} from "./styles/pager.styles";
export type {
    PagerBaseStyleOverrides,
    PagerBaseVariantProps,
    PagerInfoStyleOverrides,
    PagerInputStyleOverrides,
    PagerListItemStyleOverrides,
    PagerListItemVariantProps,
    PagerListStyleOverrides,
    PagerStyleOverrides,
    PagerStylesProviderConfig,
    PagerStyleStrategy,
    PagerVariantInputs,
    PagerVariantProps,
    PagerVariantsFunctions
} from "./styles/pager.styles";
