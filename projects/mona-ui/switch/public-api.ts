/*
 * Public API Surface of @nanahoshi/mona-ui/switch
 */

export * from "./components/switch/switch.component";

export * from "./directives/switch-handle-content-template.directive";
export * from "./directives/switch-off-label-template.directive";
export * from "./directives/switch-on-label-template.directive";

export {
    createSwitchStyleStrategy,
    provideSwitchStyles,
    SWITCH_STYLE_OVERRIDES,
    SWITCH_STYLE_STRATEGY
} from "./styles/switch.styles";
export type {
    SwitchHandleCompoundStyleOverride,
    SwitchHandleStyleOverrides,
    SwitchHandleVariantProps,
    SwitchLabelStyleOverrides,
    SwitchLabelVariantProps,
    SwitchStyleOverrides,
    SwitchStylesProviderConfig,
    SwitchStyleStrategy,
    SwitchTrackCompoundStyleOverride,
    SwitchTrackStyleOverrides,
    SwitchTrackVariantProps,
    SwitchVariantInputs,
    SwitchVariantProps,
    SwitchVariantsFunctions
} from "./styles/switch.styles";
