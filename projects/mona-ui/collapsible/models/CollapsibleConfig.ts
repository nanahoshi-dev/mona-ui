import { InjectionToken, type Signal } from "@angular/core";

export const CollapsibleToken = new InjectionToken<CollapsibleConfig>("MONA_COLLAPSIBLE");

/**
 * The contract a collapsible root exposes to its trigger and content parts.
 */
export interface CollapsibleConfig {
    readonly animate: Signal<boolean>;
    collapse(): void;
    readonly contentId: string;
    readonly disabled: Signal<boolean>;
    expand(): void;
    readonly expanded: Signal<boolean>;
    toggle(): void;
}
