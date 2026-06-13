import { InjectionToken } from "@angular/core";
import { PopupReference } from "./PopupReference";
import { PopupSettings } from "./PopupSettings";

export const PopupDataInjectionToken = new InjectionToken("PopupInjectionToken");
export const PopupReferenceInjectionToken = new InjectionToken<PopupReference>("PopupReferenceInjectionToken");
export const PopupSettingsInjectionToken = new InjectionToken<PopupSettings>("PopupSettingsInjectionToken");
