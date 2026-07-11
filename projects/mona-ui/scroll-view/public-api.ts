/*
 * Public API Surface of @nanahoshi/mona-ui/scroll-view
 */

export * from "./components/scroll-view/scroll-view.component";
export * from "./directives/scroll-view-active-page.directive";
export * from "./models/PagerOverlay";

export {
    createScrollViewStyleStrategy,
    provideScrollViewStyles,
    SCROLL_VIEW_STYLE_OVERRIDES,
    SCROLL_VIEW_STYLE_STRATEGY
} from "./styles/scroll-view.styles";
export type {
    ScrollViewArrowCompoundStyleOverride,
    ScrollViewArrowStyleOverrides,
    ScrollViewArrowVariantInput,
    ScrollViewArrowVariantProps,
    ScrollViewBaseCompoundStyleOverride,
    ScrollViewBaseStyleOverrides,
    ScrollViewBaseVariantInput,
    ScrollViewBaseVariantProps,
    ScrollViewContentStyleOverrides,
    ScrollViewContentVariantInput,
    ScrollViewContentVariantProps,
    ScrollViewListStyleOverrides,
    ScrollViewListVariantInput,
    ScrollViewListVariantProps,
    ScrollViewPagerArrowStyleOverrides,
    ScrollViewPagerArrowVariantInput,
    ScrollViewPagerArrowVariantProps,
    ScrollViewPagerCompoundStyleOverride,
    ScrollViewPagerListContainerStyleOverrides,
    ScrollViewPagerListContainerVariantInput,
    ScrollViewPagerListContainerVariantProps,
    ScrollViewPagerListItemCompoundStyleOverride,
    ScrollViewPagerListItemStyleOverrides,
    ScrollViewPagerListItemVariantInput,
    ScrollViewPagerListItemVariantProps,
    ScrollViewPagerListStyleOverrides,
    ScrollViewPagerListVariantInput,
    ScrollViewPagerListVariantProps,
    ScrollViewPagerStyleOverrides,
    ScrollViewPagerVariantInput,
    ScrollViewPagerVariantProps,
    ScrollViewStyleOverrides,
    ScrollViewStylesProviderConfig,
    ScrollViewStyleStrategy,
    ScrollViewVariantInput,
    ScrollViewVariantProps,
    ScrollViewVariantsFunctions
} from "./styles/scroll-view.styles";
