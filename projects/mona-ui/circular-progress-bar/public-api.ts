/*
 * Public API Surface of @nanahoshi/mona-ui/circular-progress-bar
 */

export * from "./components/circular-progress-bar/circular-progress-bar.component";
export * from "./directives/circular-progress-bar-label-template.directive";

export * from "./models/LabelTemplateContext";

export {
    CIRCULAR_PROGRESS_BAR_STYLE_OVERRIDES,
    CIRCULAR_PROGRESS_BAR_STYLE_STRATEGY,
    createCircularProgressBarStyleStrategy,
    provideCircularProgressBarStyles
} from "./styles/circular-progress-bar.styles";
export type {
    CircularProgressBarBaseCompoundStyleOverride,
    CircularProgressBarBaseStyleOverrides,
    CircularProgressBarBaseVariantInput,
    CircularProgressBarBaseVariantProps,
    CircularProgressBarStyleOverrides,
    CircularProgressBarStylesProviderConfig,
    CircularProgressBarStyleStrategy,
    CircularProgressBarVariantInput,
    CircularProgressBarVariantProps,
    CircularProgressBarVariantsFunctions
} from "./styles/circular-progress-bar.styles";
