/*
 * Public API Surface of @nanahoshi/mona-ui/progress-bar
 */

export * from "./components/progress-bar/progress-bar.component";
export * from "./directives/progress-bar-label-template.directive";

export * from "./models/LabelPosition";
export * from "./models/LabelTemplateContext";

export {
    createProgressBarStyleStrategy,
    PROGRESS_BAR_STYLE_OVERRIDES,
    PROGRESS_BAR_STYLE_STRATEGY,
    provideProgressBarStyles
} from "./styles/progress-bar.styles";
export type {
    ProgressBarBaseCompoundStyleOverride,
    ProgressBarBaseStyleOverrides,
    ProgressBarBaseVariantInput,
    ProgressBarBaseVariantProps,
    ProgressBarIndeterminateStyleOverrides,
    ProgressBarIndeterminateVariantInput,
    ProgressBarIndeterminateVariantProps,
    ProgressBarLabelStyleOverrides,
    ProgressBarLabelVariantInput,
    ProgressBarLabelVariantProps,
    ProgressBarStyleOverrides,
    ProgressBarStylesProviderConfig,
    ProgressBarStyleStrategy,
    ProgressBarTrackCompoundStyleOverride,
    ProgressBarTrackStyleOverrides,
    ProgressBarTrackVariantInput,
    ProgressBarTrackVariantProps,
    ProgressBarVariantInput,
    ProgressBarVariantProps,
    ProgressBarVariantsFunctions
} from "./styles/progress-bar.styles";
