/*
 * Public API Surface of @nanahoshi/mona-ui/tabs
 */

export * from "./models/TabCloseEvent";
export * from "./models/TabSelectEvent";
export * from "./directives/tab-content-template.directive";
export * from "./directives/tab-title-template.directive";
export * from "./components/tabs/tabs.component";
export * from "./components/tab/tab.component";

export {
    createTabsStyleStrategy,
    provideTabsStyles,
    TABS_STYLE_OVERRIDES,
    TABS_STYLE_STRATEGY
} from "./styles/tabs.styles";
export type {
    TabContentStyleOverrides,
    TabContentVariantProps,
    TabListBaseStyleOverrides,
    TabListBaseVariantProps,
    TabListListItemCompoundStyleOverride,
    TabListListItemStyleOverrides,
    TabListListItemVariantInput,
    TabListListItemVariantProps,
    TabListListStyleOverrides,
    TabListListWrapperStyleOverrides,
    TabListScrollButtonStyleOverrides,
    TabListScrollButtonVariantProps,
    TabListVariantInput,
    TabListVariantProps,
    TabsBaseStyleOverrides,
    TabsStyleOverrides,
    TabsStylesProviderConfig,
    TabsStyleStrategy,
    TabsVariantInput,
    TabsVariantProps,
    TabsVariantsFunctions
} from "./styles/tabs.styles";
