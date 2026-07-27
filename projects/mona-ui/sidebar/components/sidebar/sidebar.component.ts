import { CdkTrapFocus } from "@angular/cdk/a11y";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    untracked
} from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import type { SidebarCollapsibleMode } from "../../models/SidebarCollapsibleMode";
import type { SidebarSide } from "../../models/SidebarSide";
import type { SidebarVariant } from "../../models/SidebarVariant";
import { SidebarLayoutService } from "../../services/sidebar-layout.service";
import { SidebarService } from "../../services/sidebar.service";
import { sidebarBorderAllowance, sidebarThemeVariants } from "../../styles/sidebar.styles";

/**
 * @description
 * The sidebar region itself. Content is projected in author order, so header, content and footer
 * parts appear exactly where they are written.
 *
 * Below the layout's `mobileBreakpoint` it presents as a modal overlay drawer: focus is trapped
 * inside it while open, restored to whatever opened it on close, and the rest of the layout is made
 * inert. It is not a navigation landmark by itself — wrap the menus in a labelled `nav`, or set
 * `role` and `ariaLabel` if the whole region is navigation.
 */
@Component({
    selector: "mona-sidebar",
    template: `<ng-content></ng-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    hostDirectives: [CdkTrapFocus],
    host: {
        "[attr.aria-hidden]": "hidden() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-modal]": "drawer() ? 'true' : null",
        "[attr.data-collapsible]": "collapsible()",
        "[attr.data-side]": "logicalSide()",
        "[attr.data-state]": "state()",
        "[attr.data-variant]": "variant()",
        "[attr.id]": "sidebarId()",
        // A panel that is out of view must be out of the tab order and out of the accessibility tree
        // with it. `inert` is the one attribute that does both; width alone left every control in the
        // collapsed panel reachable by keyboard and readable by assistive technology.
        "[attr.inert]": "hidden() ? '' : null",
        "[attr.role]": "resolvedRole()",
        "[class]": "baseClass()",
        "[style.width]": "widthString()"
    },
    // One service per sidebar, not per layout, so a layout can hold more than one of these and each
    // keeps its own side, width and open state. Descendants resolve the nearest one, which is theirs.
    providers: [SidebarService]
})
export class SidebarComponent {
    readonly #focusTrap = inject(CdkTrapFocus);
    readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #injector = inject(Injector);
    readonly #layoutService = inject(SidebarLayoutService, { optional: true });
    readonly #sidebarService = inject(SidebarService);
    #restoreFocusTo: HTMLElement | null = null;

    protected readonly baseClass = computed(() => {
        const variantClass = sidebarThemeVariants({
            drawer: this.drawer(),
            open: this.#sidebarService.mobileOpen(),
            side: this.#sidebarService.side(),
            variant: this.variant(),
            flush: this.offCanvasClosed()
        });
        return twMerge(variantClass, this.userClass());
    });

    /** The compact presentation: an overlay pinned to one edge rather than a column in the flow. */
    protected readonly drawer = this.#sidebarService.compact;

    /** Published rather than the raw input, so a `left`/`right` alias still reports as `start`/`end`. */
    protected readonly logicalSide = this.#sidebarService.side;

    /**
     * Whether the panel is out of view entirely. The icon rail does not count — it is still on screen
     * and still operable — but a closed drawer and a fully collapsed off-canvas sidebar both do.
     */
    protected readonly hidden = computed(() => {
        if (this.drawer()) {
            return !this.#sidebarService.mobileOpen();
        }
        return this.offCanvasClosed();
    });

    protected readonly offCanvasClosed = computed(
        () => !this.drawer() && !this.#sidebarService.expanded() && this.collapsible() === "offcanvas"
    );

    /** A drawer is a modal surface; a docked sidebar keeps whatever role the consumer gave it. */
    protected readonly resolvedRole = computed(() => (this.drawer() ? "dialog" : this.role() || null));

    protected readonly sidebarId = this.#sidebarService.sidebarId;
    protected readonly state = this.#sidebarService.state;

    /**
     * `width` and `iconWidth` are the width the sidebar's *contents* get, because that is what the
     * parts inside are measured against — an icon rail less a region's padding is meant to leave
     * exactly one icon square. The variant's border is painted inside the box under the global
     * `border-box`, so it is added back on here rather than being taken out of that measurement.
     */
    protected readonly widthString = computed(() => {
        // A drawer is always at full width; it is moved out of view rather than shrunk.
        if (this.drawer()) {
            return this.#withBorderAllowance(toCssLength(this.mobileWidth()));
        }
        if (this.#sidebarService.expanded()) {
            return this.#withBorderAllowance(toCssLength(this.width()));
        }
        // A fully collapsed sidebar is the exception: it has no contents to make room for.
        return this.collapsible() === "icon" ? this.#withBorderAllowance(toCssLength(this.iconWidth())) : "0px";
    });

    /**
     * @description Accessible name for the sidebar region. Required when `role` is set, and used as the
     * drawer's name on compact viewports.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description How the sidebar behaves when collapsed. `"icon"` keeps a narrow rail of icons visible,
     * `"offcanvas"` removes it from the layout entirely, and `"none"` disables collapsing altogether.
     * @default "offcanvas"
     */
    public readonly collapsible = input<SidebarCollapsibleMode>("offcanvas");

    /**
     * @description Sets whether this sidebar is open. Supports two-way binding. While the viewport is
     * compact this reflects the drawer, so one binding drives both presentations.
     * @default true
     */
    public readonly expanded = model(true);

    /**
     * @description Width of the icon rail while collapsed. Only applies when `collapsible` is `"icon"`.
     * Numbers are treated as pixels.
     * @default "3rem"
     */
    public readonly iconWidth = input<string | number>("3rem");

    /**
     * @description Id for the sidebar element, referenced by triggers through `aria-controls`. Supply a
     * stable value when the markup is server rendered, so the client does not hydrate onto a different
     * generated id. Falls back to a generated id.
     * @default ""
     */
    public readonly id = input("");

    /**
     * @description Width of the overlay drawer on compact viewports. Numbers are treated as pixels.
     * @default "18rem"
     */
    public readonly mobileWidth = input<string | number>("18rem");

    /**
     * @description ARIA role for the sidebar region. Leave unset and wrap the menus in a labelled `nav`
     * when the sidebar holds more than navigation; set `"navigation"` with an `aria-label` when it does
     * not. Ignored on compact viewports, where the drawer is a `dialog`.
     * @default ""
     */
    public readonly role = input("");

    /**
     * @description Which edge the sidebar sits on. Prefer `"start"` and `"end"`, which follow the
     * document's writing direction; `"left"` and `"right"` are aliases of them.
     * @default "start"
     */
    public readonly side = input<SidebarSide>("start");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    /**
     * @description The visual treatment of the sidebar. `"floating"` detaches it from the edge on its own
     * surface, and `"inset"` moves that raised surface onto the region beside it instead.
     * @default "sidebar"
     */
    public readonly variant = input<SidebarVariant>("sidebar");

    /**
     * @description Width of the sidebar while expanded. Numbers are treated as pixels.
     * @default "16rem"
     */
    public readonly width = input<string | number>("16rem");

    public constructor() {
        // These are authored here but read by descendants, so they have to reach the shared service.
        effect(() => {
            const collapsible = this.collapsible();
            const id = this.id();
            const side = this.side();
            const variant = this.variant();
            untracked(() => {
                this.#sidebarService.setCollapsible(collapsible);
                this.#sidebarService.setId(id);
                this.#sidebarService.setSide(side);
                this.#sidebarService.setVariant(variant);
            });
        });

        effect(() => {
            const expanded = this.expanded();
            untracked(() => this.#sidebarService.setExpanded(expanded));
        });
        effect(() => {
            const expanded = this.#sidebarService.expanded();
            untracked(() => this.expanded.set(expanded));
        });

        // Keyed on the resolved id rather than the input, so a sidebar left to generate its own id is
        // still reachable by a trigger. The effect's cleanup covers both halves of a changed id — the
        // old key is dropped before the new one is added — as well as teardown.
        effect(onCleanup => {
            const layoutService = this.#layoutService;
            if (!layoutService) {
                return;
            }
            const id = this.#sidebarService.sidebarId();
            onCleanup(layoutService.register(id, this.#sidebarService.controller));
        });

        effect(() => {
            const trapped = this.drawer() && this.#sidebarService.mobileOpen();
            untracked(() => this.#setFocusTrapped(trapped));
        });
    }

    /**
     * The trap is only armed for the drawer. A docked sidebar sits in the page beside its content, and
     * holding focus inside it would leave the keyboard unable to reach the rest of the layout at all.
     */
    #setFocusTrapped(trapped: boolean): void {
        this.#focusTrap.enabled = trapped;
        if (trapped) {
            const active = document.activeElement;
            this.#restoreFocusTo = active instanceof HTMLElement ? active : null;
            this.#focusTrap.focusTrap.focusInitialElementWhenReady();
            return;
        }

        const restoreTo = this.#restoreFocusTo;
        this.#restoreFocusTo = null;
        // Only pull focus back if it is still inside the panel that is closing. Moving it otherwise
        // would yank the caret away from wherever the user has since gone.
        if (!restoreTo || !this.#host.nativeElement.contains(document.activeElement)) {
            return;
        }
        /*
         * Deferred to the next render, not called here. Whatever opened the drawer is almost always
         * behind it, and the region behind it is still `inert` at this point in the change detection
         * pass — `focus()` on an element inside an inert subtree fails silently, which left focus
         * stranded inside the panel that was about to become inert itself.
         */
        afterNextRender(
            () => {
                if (restoreTo.isConnected) {
                    restoreTo.focus();
                }
            },
            { injector: this.#injector }
        );
    }

    #withBorderAllowance(width: string): string {
        const allowance = sidebarBorderAllowance[this.variant()];
        // The `inset` variant draws no border, so it is left as an ordinary length.
        return allowance === "0px" ? width : `calc(${width} + ${allowance})`;
    }
}

function toCssLength(value: string | number): string {
    return typeof value === "number" ? `${value}px` : value;
}
