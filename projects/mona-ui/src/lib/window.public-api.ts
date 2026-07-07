/*
 * Public API Surface of @mirei/mona-ui/window
 */

export * from "./dialogs/window/components/window/window.component";
export * from "./dialogs/window/directives/window-action-template.directive";
export * from "./dialogs/window/directives/window-content-template.directive";
export * from "./dialogs/window/directives/window-footer-template.directive";
export * from "./dialogs/window/directives/window-title-template.directive";

export * from "./dialogs/window/services/window.service";

export * from "./dialogs/window/models/MoveEvent";
export * from "./dialogs/window/models/ResizeEvent";
export * from "./dialogs/window/models/WindowActionTemplateContext";
export { WindowRef } from "./dialogs/window/models/WindowRef";
export * from "./dialogs/window/models/WindowSettings";
export type { WindowVariantProps } from "./dialogs/window/styles/window.styles";

export type { Action } from "./utils/Action";
export { PopupCloseEvent, PopupCloseSource } from "./popup/models/PopupCloseEvent";
export type { PopupCloseEventOptions } from "./popup/models/PopupCloseEvent";
