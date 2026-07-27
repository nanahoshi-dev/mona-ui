import { computed, Service, signal } from "@angular/core";
import type { SidebarController } from "../models/SidebarController";
import type { SidebarVariant } from "../models/SidebarVariant";

/**
 * Layout-wide state shared by every sidebar under one `mona-sidebar-layout`. Provided by
 * `SidebarLayoutComponent`, while each `mona-sidebar` provides its own `SidebarService`.
 *
 * A layout can hold more than one sidebar — a navigation column on one edge and an inspector on the
 * other — so the things that genuinely belong to the layout rather than to any one sidebar live here:
 * the breakpoint, the registry the layout and its siblings look sidebars up in, and the rule that only
 * one drawer is open at a time.
 *
 * This class is internal, and is not reachable through the public API. Consumers read a single
 * sidebar's state through `injectSidebar()`.
 */
@Service({ autoProvided: false })
export class SidebarLayoutService {
    readonly #compact = signal(false);
    readonly #controllers = signal<ReadonlyMap<string, SidebarController>>(new Map());

    /**
     * @description Whether any sidebar's drawer is open. The layout paints one backdrop for all of
     * them, and the region beside them steps out of the way for whichever one is showing.
     */
    public readonly anyMobileOpen = computed(() =>
        [...this.#controllers().values()].some(controller => controller.mobileOpen())
    );

    /** @description Whether the viewport is narrow enough for sidebars to present as overlay drawers. */
    public readonly compact = this.#compact.asReadonly();

    /**
     * @description The first sidebar registered in the layout, in author order.
     *
     * What the parts that sit beside the sidebars rather than inside one fall back to: a trigger in a
     * shared header with no `for` set, and the inset's surface. Best effort by design — with more than
     * one sidebar in the layout there is no single right answer, and author order is the predictable
     * one. Name a sidebar with `for` to be explicit.
     */
    public readonly primaryController = computed<SidebarController | null>(
        () => this.#controllers().values().next().value ?? null
    );

    /** @description The variant of the primary sidebar, which is the one the inset takes its surface from. */
    public readonly primaryVariant = computed<SidebarVariant>(() => this.primaryController()?.variant() ?? "sidebar");

    /** Closes every open drawer. Backs the shared backdrop and the layout's Escape handling. */
    public closeAll(): void {
        for (const controller of this.#controllers().values()) {
            if (controller.mobileOpen()) {
                controller.collapse();
            }
        }
    }

    /** @description The sidebar registered under `id`, or `null` when no sidebar answers to it. */
    public getController(id: string): SidebarController | null {
        return this.#controllers().get(id) ?? null;
    }

    /**
     * Closes any other open drawer, so only one is ever showing. Called by a sidebar as it opens its
     * own: two drawers overlaying the same layout would stack their backdrops and fight over the focus
     * trap, and on the viewport that puts them there, there is only room for one.
     */
    public notifyOpening(openingId: string): void {
        for (const [id, controller] of this.#controllers()) {
            if (id !== openingId && controller.mobileOpen()) {
                controller.collapse();
            }
        }
    }

    /**
     * Adds a sidebar to the registry and returns the callback that removes it again. `mona-sidebar`
     * re-runs this whenever its resolved id changes and calls the result on teardown.
     *
     * Two sidebars sharing an id collide here, and the later registration wins. That is a mistake in
     * the markup rather than something to recover from — ids are already required to be unique in a
     * document — so it is left to the duplicate `id` attributes to surface it.
     */
    public register(id: string, controller: SidebarController): () => void {
        this.#controllers.update(controllers => new Map(controllers).set(id, controller));
        return () => {
            this.#controllers.update(controllers => {
                // Only if this registration is still the current one. An id that has since been taken
                // over by another sidebar belongs to that sidebar now, and must survive this cleanup.
                if (controllers.get(id) !== controller) {
                    return controllers;
                }
                const next = new Map(controllers);
                next.delete(id);
                return next;
            });
        };
    }

    /** @internal Published by `mona-sidebar-layout` from its breakpoint query. */
    public setCompact(compact: boolean): void {
        this.#compact.set(compact);
    }
}
