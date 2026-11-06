import { InjectionToken } from "@angular/core";

/** Lets a panel know which accordion it belongs to, so a nested accordion's panels aren't counted as the outer one's. */
export const EXPANSION_PANEL_ACCORDION = new InjectionToken<object>("EXPANSION_PANEL_ACCORDION");
