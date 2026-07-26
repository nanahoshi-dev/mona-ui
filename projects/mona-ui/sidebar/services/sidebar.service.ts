import { computed, Service, signal } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import type { SidebarCollapsibleMode } from "../models/SidebarCollapsibleMode";
import type { SidebarSide } from "../models/SidebarSide";
import type { SidebarVariant } from "../models/SidebarVariant";

/**
 * Shared state for one sidebar region. Provided by `SidebarLayoutComponent` and injectable by any
 * descendant, so triggers and menu parts can read and drive the expanded state without input chains.
 */
@Service({ autoProvided: false })
export class SidebarService {
    readonly #collapsible = signal<SidebarCollapsibleMode>("offcanvas");
    readonly #expanded = signal(true);
    readonly #side = signal<SidebarSide>("left");
    readonly #variant = signal<SidebarVariant>("sidebar");

    /** @description How the sidebar behaves when collapsed. Set by the `mona-sidebar` it belongs to. */
    public readonly collapsible = this.#collapsible.asReadonly();

    /** @description Whether the sidebar is currently expanded. Always `true` while `collapsible` is `"none"`. */
    public readonly expanded = computed(() => this.#collapsible() === "none" || this.#expanded());

    /**
     * @description Whether the sidebar is currently showing its icon rail, meaning parts that only make
     * sense at full width — labels, trailing actions, submenus — should step aside.
     */
    public readonly iconOnly = computed(() => this.#collapsible() === "icon" && !this.expanded());

    /** @description Which edge the sidebar sits on. Set by the `mona-sidebar` it belongs to. */
    public readonly side = this.#side.asReadonly();

    /** @description Id assigned to the sidebar element and referenced by triggers through `aria-controls`. */
    public readonly sidebarId = createElementControlId();

    /** @description The expanded state as a string, for `data-state` bindings and styling hooks. */
    public readonly state = computed(() => (this.expanded() ? "expanded" : "collapsed"));

    /** @description The visual treatment of the sidebar. Set by the `mona-sidebar` it belongs to. */
    public readonly variant = this.#variant.asReadonly();

    public collapse(): void {
        this.setExpanded(false);
    }

    public expand(): void {
        this.setExpanded(true);
    }

    public setCollapsible(collapsible: SidebarCollapsibleMode): void {
        this.#collapsible.set(collapsible);
    }

    public setExpanded(expanded: boolean): void {
        if (this.#collapsible() === "none") {
            return;
        }
        this.#expanded.set(expanded);
    }

    public setSide(side: SidebarSide): void {
        this.#side.set(side);
    }

    public setVariant(variant: SidebarVariant): void {
        this.#variant.set(variant);
    }

    public toggle(): void {
        this.setExpanded(!this.expanded());
    }
}
