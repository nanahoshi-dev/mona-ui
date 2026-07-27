import { computed, linkedSignal, Service, signal } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import type { SidebarCollapsibleMode } from "../models/SidebarCollapsibleMode";
import type { SidebarController } from "../models/SidebarController";
import { type SidebarLogicalSide, type SidebarSide, toLogicalSide } from "../models/SidebarSide";
import type { SidebarVariant } from "../models/SidebarVariant";

/**
 * Shared state for one sidebar region. Provided by `SidebarLayoutComponent` and injectable by any
 * descendant, so triggers and menu parts can read and drive the sidebar without input chains.
 *
 * This class is internal. Consumers reach the same state through `injectSidebar()`, which hands back
 * a `SidebarController`: the reads, and the commands that are safe from anywhere. The structural
 * setters here exist so `mona-sidebar` can publish its own inputs, and calling them from elsewhere
 * would leave the service and the component disagreeing until the next change detection pass.
 */
@Service({ autoProvided: false })
export class SidebarService {
    readonly #collapsible = signal<SidebarCollapsibleMode>("offcanvas");
    readonly #compact = signal(false);
    readonly #expanded = signal(true);
    readonly #generatedId = createElementControlId();
    readonly #providedId = signal<string | null>(null);
    readonly #side = signal<SidebarSide>("start");
    readonly #variant = signal<SidebarVariant>("sidebar");

    /**
     * Reset every time the viewport crosses the breakpoint. A drawer left open on a phone must not
     * still count as open when the window is widened back to a desktop layout, where the same flag
     * would be read as the docked sidebar's state.
     */
    readonly #mobileOpen = linkedSignal<boolean, boolean>({
        source: () => this.#compact(),
        computation: () => false
    });

    /** @description How the sidebar behaves when collapsed. Set by the `mona-sidebar` it belongs to. */
    public readonly collapsible = this.#collapsible.asReadonly();

    /** @description Whether the sidebar presents as an overlay drawer rather than as a column. */
    public readonly compact = this.#compact.asReadonly();

    /**
     * @description Whether the sidebar is open. While compact this reports the drawer, so one binding
     * drives both presentations. Always `true` while `collapsible` is `"none"` on a wide viewport.
     */
    public readonly expanded = computed(() => {
        if (this.#compact()) {
            return this.#mobileOpen();
        }
        return this.#collapsible() === "none" || this.#expanded();
    });

    /**
     * @description Whether the sidebar is currently showing its icon rail, meaning parts that only make
     * sense at full width — labels, trailing actions, submenus — should step aside. Never true while
     * compact: a drawer has the room to present everything at full width.
     */
    public readonly iconOnly = computed(() => !this.#compact() && this.#collapsible() === "icon" && !this.expanded());

    /** @description Whether the overlay drawer is open. Only meaningful while `compact` is true. */
    public readonly mobileOpen = computed(() => this.#compact() && this.#mobileOpen());

    /** @description Which edge the sidebar sits on, resolved to a direction-relative side. */
    public readonly side = computed<SidebarLogicalSide>(() => toLogicalSide(this.#side()));

    /**
     * @description Id assigned to the sidebar element and referenced by triggers through `aria-controls`.
     * Falls back to a generated id when the consumer supplies none.
     */
    public readonly sidebarId = computed(() => this.#providedId() ?? this.#generatedId);

    /** @description The expanded state as a string, for `data-state` bindings and styling hooks. */
    public readonly state = computed<"expanded" | "collapsed">(() => (this.expanded() ? "expanded" : "collapsed"));

    /** @description The visual treatment of the sidebar. Set by the `mona-sidebar` it belongs to. */
    public readonly variant = this.#variant.asReadonly();

    /** @description The subset of this service that is safe to hand to a consumer. */
    public readonly controller: SidebarController = {
        collapse: () => this.collapse(),
        collapsible: this.collapsible,
        compact: this.compact,
        expand: () => this.expand(),
        expanded: this.expanded,
        iconOnly: this.iconOnly,
        mobileOpen: this.mobileOpen,
        side: this.side,
        sidebarId: this.sidebarId,
        state: this.state,
        toggle: () => this.toggle(),
        variant: this.variant
    };

    public collapse(): void {
        this.setExpanded(false);
    }

    public expand(): void {
        this.setExpanded(true);
    }

    /** @internal Published by `mona-sidebar` from its own input. */
    public setCollapsible(collapsible: SidebarCollapsibleMode): void {
        this.#collapsible.set(collapsible);
    }

    /** @internal Published by `mona-sidebar-layout` from its breakpoint query. */
    public setCompact(compact: boolean): void {
        this.#compact.set(compact);
    }

    /**
     * Routed to whichever presentation is current, so a trigger, a rail and a `[(expanded)]` binding
     * all mean the same thing on a phone as they do on a desktop.
     */
    public setExpanded(expanded: boolean): void {
        if (this.#compact()) {
            this.#mobileOpen.set(expanded);
            return;
        }
        if (this.#collapsible() === "none") {
            return;
        }
        this.#expanded.set(expanded);
    }

    /** @internal Published by `mona-sidebar` from its own input. */
    public setId(id: string | null): void {
        this.#providedId.set(id || null);
    }

    /** @internal Published by `mona-sidebar` from its own input. */
    public setSide(side: SidebarSide): void {
        this.#side.set(side);
    }

    /** @internal Published by `mona-sidebar` from its own input. */
    public setVariant(variant: SidebarVariant): void {
        this.#variant.set(variant);
    }

    public toggle(): void {
        this.setExpanded(!this.expanded());
    }
}
