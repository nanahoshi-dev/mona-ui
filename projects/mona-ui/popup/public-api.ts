/*
 * Public API Surface of @nanahoshi/mona-ui/popup
 */

export * from "./components/popup/popup.component";
export * from "./services/popup.service";

export { PopupRef } from "./models/PopupRef";
export { PopupCloseEvent, PopupCloseSource } from "./models/PopupCloseEvent";
export * from "./models/PopupAnimationClasses";
export type { PopupAnchor, PopupAnimationSettings, PopupSettings } from "./models/PopupSettings";
export * from "./models/PopupOffset";
export { PopupDataInjectionToken } from "./models/PopupInjectionToken";
export type { ConnectionPoint } from "./utils/connectionPosition";
