import { InjectionToken, type Signal } from "@angular/core";

export const COLLAPSIBLE_CONFIG = new InjectionToken<CollapsibleConfig>("COLLAPSIBLE_CONFIG");

/**
 * The contract a collapsible root exposes to its trigger and content parts.
 */
export interface CollapsibleConfig {
    readonly animate: Signal<boolean>;
    /** Collapses the content. */
    collapse(): void;
    readonly contentId: string;
    readonly disabled: Signal<boolean>;
    /** Expands the content. */
    expand(): void;
    readonly expanded: Signal<boolean>;
    /** Takes the id the content was given, so the trigger points at it. A root without it always uses `contentId`. */
    setContentId?(id: string | null): void;
    /** Switches between expanded and collapsed. The trigger calls it on activation. */
    toggle(): void;
}
