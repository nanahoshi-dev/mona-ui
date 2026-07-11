/*
 * Public API Surface of @nanahoshi/mona-ui/window
 */

export * from "./components/window/window.component";
export * from "./directives/window-action-template.directive";
export * from "./directives/window-content-template.directive";
export * from "./directives/window-footer-template.directive";
export * from "./directives/window-title-template.directive";

export * from "./services/window.service";

export * from "./models/MoveEvent";
export * from "./models/ResizeEvent";
export * from "./models/WindowActionTemplateContext";
export { WindowRef } from "./models/WindowRef";
export * from "./models/WindowSettings";

export { createWindowStyleStrategy, provideWindowStyles, WINDOW_STYLE_OVERRIDES, WINDOW_STYLE_STRATEGY } from "./styles/window.styles";
export type {
    WindowBaseCompoundStyleOverride,
    WindowBaseStyleOverrides,
    WindowBaseVariantInput,
    WindowBaseVariantProps,
    WindowContentContainerCompoundStyleOverride,
    WindowContentContainerStyleOverrides,
    WindowContentContainerVariantInput,
    WindowContentContainerVariantProps,
    WindowContentStyleOverrides,
    WindowContentVariantInput,
    WindowContentVariantProps,
    WindowResizerCompoundStyleOverride,
    WindowResizerStyleOverrides,
    WindowResizerVariantInput,
    WindowResizerVariantProps,
    WindowStyleOverrides,
    WindowStylesProviderConfig,
    WindowStyleStrategy,
    WindowTitleBarActionStyleOverrides,
    WindowTitleBarActionVariantInput,
    WindowTitleBarActionVariantProps,
    WindowTitleBarCompoundStyleOverride,
    WindowTitleBarStyleOverrides,
    WindowTitleBarVariantInput,
    WindowTitleBarVariantProps,
    WindowTitleCompoundStyleOverride,
    WindowTitleContainerStyleOverrides,
    WindowTitleContainerVariantInput,
    WindowTitleContainerVariantProps,
    WindowTitleStyleOverrides,
    WindowTitleVariantInput,
    WindowTitleVariantProps,
    WindowVariantInput,
    WindowVariantProps,
    WindowVariantsFunctions
} from "./styles/window.styles";
