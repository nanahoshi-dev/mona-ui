import { InjectionToken } from "@angular/core";
import { PopupReference } from "./PopupReference";

/**
 * @internal - used by the popup service. Do not use directly or export.
 */
export const PopupReferenceInjectionToken = new InjectionToken<PopupReference>("PopupReferenceInjectionToken");
