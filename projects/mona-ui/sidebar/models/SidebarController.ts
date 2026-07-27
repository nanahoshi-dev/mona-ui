import type { Signal } from "@angular/core";
import type { SidebarCollapsibleMode } from "./SidebarCollapsibleMode";
import type { SidebarLogicalSide } from "./SidebarSide";
import type { SidebarVariant } from "./SidebarVariant";

/**
 * The safe, read-and-command view of one sidebar, returned by `injectSidebar()`.
 *
 * Structural facts — side, variant, collapsible mode — are readable but not settable. They are
 * authored as inputs on `mona-sidebar`, and letting a descendant write them would leave the service
 * and the component disagreeing about the same sidebar, with the component winning on the next
 * change detection pass. Consumers who need them to change should bind the inputs.
 */
export interface SidebarController {
    /** Closes the sidebar. On a compact viewport this closes the drawer instead. */
    collapse(): void;

    /** How the sidebar behaves when collapsed, as authored on `mona-sidebar`. */
    readonly collapsible: Signal<SidebarCollapsibleMode>;

    /**
     * Whether the viewport is narrow enough that the sidebar presents as an overlay drawer rather
     * than as a column in the layout.
     */
    readonly compact: Signal<boolean>;

    /** Opens the sidebar. On a compact viewport this opens the drawer instead. */
    expand(): void;

    /**
     * Whether the sidebar is showing at full width. On a compact viewport this reports the drawer's
     * state, so a single binding drives both presentations.
     */
    readonly expanded: Signal<boolean>;

    /**
     * Whether the sidebar is currently reduced to its icon rail, meaning parts that only make sense
     * at full width — labels, trailing actions, submenus — should step aside. Never true while
     * compact, where the drawer always presents at full width.
     */
    readonly iconOnly: Signal<boolean>;

    /** Whether the overlay drawer is open. Only meaningful while `compact` is true. */
    readonly mobileOpen: Signal<boolean>;

    /** Which edge the sidebar sits on, resolved to a direction-relative side. */
    readonly side: Signal<SidebarLogicalSide>;

    /** The id of the sidebar element, for `aria-controls` on a custom trigger. */
    readonly sidebarId: Signal<string>;

    /** The expanded state as a string, for `data-state` bindings and styling hooks. */
    readonly state: Signal<"expanded" | "collapsed">;

    /** Flips the sidebar between open and closed, on whichever presentation is current. */
    toggle(): void;

    /** The visual treatment of the sidebar, as authored on `mona-sidebar`. */
    readonly variant: Signal<SidebarVariant>;
}
