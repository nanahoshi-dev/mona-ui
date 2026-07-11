/*
 * Public API Surface of @nanahoshi/mona-ui/expansion-panel
 */

export * from "./components/expansion-panel/expansion-panel.component";
export * from "./directives/expansion-panel-actions-template.directive";
export * from "./directives/expansion-panel-icon-template.directive";
export * from "./directives/expansion-panel-title-template.directive";

export {
    createExpansionPanelStyleStrategy,
    EXPANSION_PANEL_STYLE_OVERRIDES,
    EXPANSION_PANEL_STYLE_STRATEGY,
    provideExpansionPanelStyles
} from "./styles/expansion-panel.styles";
export type {
    ExpansionPanelBaseCompoundStyleOverride,
    ExpansionPanelBaseStyleOverrides,
    ExpansionPanelBaseVariantInput,
    ExpansionPanelBaseVariantProps,
    ExpansionPanelContentCompoundStyleOverride,
    ExpansionPanelContentStyleOverrides,
    ExpansionPanelContentVariantInput,
    ExpansionPanelContentVariantProps,
    ExpansionPanelHeaderCompoundStyleOverride,
    ExpansionPanelHeaderStyleOverrides,
    ExpansionPanelHeaderTitleStyleOverrides,
    ExpansionPanelHeaderVariantInput,
    ExpansionPanelHeaderVariantProps,
    ExpansionPanelIconContainerStyleOverrides,
    ExpansionPanelIconContainerVariantInput,
    ExpansionPanelIconContainerVariantProps,
    ExpansionPanelStyleOverrides,
    ExpansionPanelStylesProviderConfig,
    ExpansionPanelStyleStrategy,
    ExpansionPanelVariantInput,
    ExpansionPanelVariantProps,
    ExpansionPanelVariantsFunctions
} from "./styles/expansion-panel.styles";
