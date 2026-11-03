import { InjectionToken } from "@angular/core";
import { PopupSettings } from "./PopupSettings";

/**
 * The `data` passed in `PopupSettings`, available to the popup content.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- public API name, kept for compatibility.
export const PopupDataInjectionToken = new InjectionToken<unknown>("PopupDataInjectionToken");
export const POPUP_SETTINGS = new InjectionToken<PopupSettings>("POPUP_SETTINGS");
