/*
 * Public API Surface of @mirei/mona-ui/popup
 */

export * from "./popup/components/popup/popup.component";
export * from "./popup/services/popup.service";

export { PopupRef } from "./popup/models/PopupRef";
export { PopupCloseEvent, PopupCloseSource } from "./popup/models/PopupCloseEvent";
export type { PopupCloseEventOptions } from "./popup/models/PopupCloseEvent";
export * from "./popup/models/PopupAnimationClasses";
export type { PopupAnchor, PopupAnimationSettings, PopupSettings } from "./popup/models/PopupSettings";
export * from "./popup/models/PopupOffset";
export * from "./popup/models/PopupInjectionToken";
export type { ConnectionPoint } from "./popup/utils/connectionPosition";

export type { Action } from "@mirei/mona-ui/common";
