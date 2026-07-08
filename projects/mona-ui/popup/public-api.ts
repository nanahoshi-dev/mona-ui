/*
 * Public API Surface of @mirei/mona-ui/popup
 */

export * from "../src/lib/popup/components/popup/popup.component";
export * from "../src/lib/popup/services/popup.service";

export { PopupRef } from "../src/lib/popup/models/PopupRef";
export { PopupCloseEvent, PopupCloseSource } from "../src/lib/popup/models/PopupCloseEvent";
export type { PopupCloseEventOptions } from "../src/lib/popup/models/PopupCloseEvent";
export * from "../src/lib/popup/models/PopupAnimationClasses";
export type {
    PopupAnchor,
    PopupAnimationSettings,
    PopupSettings
} from "../src/lib/popup/models/PopupSettings";
export * from "../src/lib/popup/models/PopupOffset";
export * from "../src/lib/popup/models/PopupInjectionToken";
export type { ConnectionPoint } from "../src/lib/popup/utils/connectionPosition";

export type { Action } from "@mirei/mona-ui/common";
