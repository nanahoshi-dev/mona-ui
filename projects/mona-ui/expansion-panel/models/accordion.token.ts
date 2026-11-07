import { InjectionToken } from "@angular/core";
import type { ExpansionPanelComponent } from "../components/expansion-panel/expansion-panel.component";

export interface ExpansionPanelAccordion {
    /** Adds a panel to the group and returns the function that removes it. */
    readonly register: (panel: ExpansionPanelComponent) => () => void;
}

/**
 * Lets a panel join the nearest accordion, wherever its template is. A nested accordion's panels find the inner one, so
 * they aren't counted as the outer one's.
 */
export const EXPANSION_PANEL_ACCORDION = new InjectionToken<ExpansionPanelAccordion>("EXPANSION_PANEL_ACCORDION");
