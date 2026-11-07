import { computed, Service, signal, type Signal } from "@angular/core";
import type { SidebarController } from "../models/SidebarController";
import type { SidebarModalScope } from "../models/SidebarModalScope";
import type { SidebarVariant } from "../models/SidebarVariant";

/** `Node.DOCUMENT_POSITION_FOLLOWING`, written out because `Node` isn't a global on every server. */
const DOCUMENT_POSITION_FOLLOWING = 4;

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
    readonly #elements = new WeakMap<SidebarController, Element>();
    readonly #modalScope = signal<SidebarModalScope>("page");
    #holdingReturnFocus = false;
    #returnFocusTo: HTMLElement | null = null;

    /**
     * @description Whether any sidebar's drawer is open. The layout paints one backdrop for all of
     * them, and the region beside them steps out of the way for whichever one is showing.
     */
    public readonly anyMobileOpen = computed(() =>
        [...this.#controllers().values()].some(controller => controller.mobileOpen())
    );

    /** @description Whether the viewport is narrow enough for sidebars to present as overlay drawers. */
    public readonly compact = this.#compact.asReadonly();

    /** @description How far an open drawer's modality reaches. Set by the `mona-sidebar-layout` it belongs to. */
    public readonly modalScope = this.#modalScope.asReadonly();

    /**
     * @description The first sidebar in the layout, in author order.
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

    /**
     * A controller for the sidebar named `id`, or for the layout's first one without an `id`. It follows that sidebar
     * rather than holding it, because a component in the inset is created before the sidebars have registered, and
     * reads as a closed sidebar while there is none.
     */
    public controllerFor(id?: string): SidebarController {
        const target = computed(() => (id ? this.getController(id) : this.primaryController()));
        return this.#followingController(target);
    }

    /** @description The sidebar registered under `id`, or `null` when no sidebar answers to it. */
    public getController(id: string): SidebarController | null {
        return this.#controllers().get(id) ?? null;
    }

    /**
     * Records where focus goes when the drawers are done. Only the first drawer's opener counts: a drawer opened from
     * inside another one would otherwise send focus back into a panel that has closed.
     */
    public holdReturnFocus(element: HTMLElement | null): void {
        if (this.#holdingReturnFocus) {
            return;
        }
        this.#holdingReturnFocus = true;
        this.#returnFocusTo = element;
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
     *
     * Kept in document order, so a sidebar that renders late or changes its id doesn't become the primary one.
     */
    public register(id: string, controller: SidebarController, element: Element): () => void {
        this.#elements.set(controller, element);
        this.#controllers.update(controllers => this.#inAuthorOrder(new Map(controllers).set(id, controller)));
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

    /**
     * Hands over where focus goes, once the drawer that's closing was the last one open. A drawer closing because
     * another one is opening hands over nothing, and that one takes the same place when it closes.
     */
    public releaseReturnFocus(closingId: string): HTMLElement | null {
        for (const [id, controller] of this.#controllers()) {
            if (id !== closingId && controller.mobileOpen()) {
                return null;
            }
        }
        const element = this.#returnFocusTo;
        this.#holdingReturnFocus = false;
        this.#returnFocusTo = null;
        return element;
    }

    /** @internal Published by `mona-sidebar-layout` from its breakpoint query. */
    public setCompact(compact: boolean): void {
        this.#compact.set(compact);
    }

    /** @internal Published by `mona-sidebar-layout` from its own input. */
    public setModalScope(scope: SidebarModalScope): void {
        this.#modalScope.set(scope);
    }

    #followingController(target: Signal<SidebarController | null>): SidebarController {
        return {
            collapse: () => target()?.collapse(),
            collapsible: computed(() => target()?.collapsible() ?? "offcanvas"),
            compact: this.compact,
            expand: () => target()?.expand(),
            expanded: computed(() => target()?.expanded() ?? false),
            iconOnly: computed(() => target()?.iconOnly() ?? false),
            mobileOpen: computed(() => target()?.mobileOpen() ?? false),
            side: computed(() => target()?.side() ?? "start"),
            sidebarId: computed(() => target()?.sidebarId() ?? ""),
            state: computed(() => target()?.state() ?? "collapsed"),
            toggle: () => target()?.toggle(),
            variant: computed(() => target()?.variant() ?? "sidebar")
        };
    }

    #inAuthorOrder(controllers: ReadonlyMap<string, SidebarController>): ReadonlyMap<string, SidebarController> {
        return new Map(
            [...controllers].sort(([, first], [, second]) => {
                const firstElement = this.#elements.get(first);
                const secondElement = this.#elements.get(second);
                if (!firstElement || !secondElement || firstElement === secondElement) {
                    return 0;
                }
                return firstElement.compareDocumentPosition(secondElement) & DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
            })
        );
    }
}
