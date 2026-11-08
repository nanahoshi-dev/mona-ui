import type { NavigationMode } from "./NavigationMode";

export interface NavigableOptions {
    /** Whether keyboard navigation is active. */
    enabled: boolean;
    /** Whether navigation only moves a visual highlight (`"highlight"`) or also changes selection (`"select"`). */
    mode: NavigationMode;
    /** Whether navigating past the last (or before the first) item cycles to the other end. */
    wrap: boolean;
}
