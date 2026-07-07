/*
 * Public API Surface of @mirei/mona-ui/window
 */

export * from "../src/lib/dialogs/window/components/window/window.component";
export * from "../src/lib/dialogs/window/directives/window-action-template.directive";
export * from "../src/lib/dialogs/window/directives/window-content-template.directive";
export * from "../src/lib/dialogs/window/directives/window-footer-template.directive";
export * from "../src/lib/dialogs/window/directives/window-title-template.directive";

export * from "../src/lib/dialogs/window/services/window.service";

export * from "../src/lib/dialogs/window/models/MoveEvent";
export * from "../src/lib/dialogs/window/models/ResizeEvent";
export * from "../src/lib/dialogs/window/models/WindowActionTemplateContext";
export { WindowRef } from "../src/lib/dialogs/window/models/WindowRef";
export * from "../src/lib/dialogs/window/models/WindowSettings";
export type { WindowVariantProps } from "../src/lib/dialogs/window/styles/window.styles";

export type { Action } from "../src/lib/utils/Action";
export { PopupCloseEvent, PopupCloseSource } from "../src/lib/popup/models/PopupCloseEvent";
export type { PopupCloseEventOptions } from "../src/lib/popup/models/PopupCloseEvent";
