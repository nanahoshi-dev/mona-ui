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
export type { WindowVariantProps } from "./styles/window.styles";
