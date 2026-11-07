import { CdkTrapFocus } from "@angular/cdk/a11y";
import { createBlockScrollStrategy } from "@angular/cdk/overlay";
import {
    afterNextRender,
    afterRenderEffect,
    ApplicationRef,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    isDevMode,
    model,
    untracked
} from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { inertOutside } from "@nanahoshi/mona-ui/internal";
import { TooltipDirective } from "@nanahoshi/mona-ui/tooltip";
import { twMerge } from "tailwind-merge";
import { SIDEBAR_DEFAULT_MESSAGES } from "../../i18n/sidebar.default-messages";
import { resolvePhysicalSide } from "../../internal/resolve-physical-side";
import type { SidebarCollapsibleMode } from "../../models/SidebarCollapsibleMode";
import type { SidebarSide } from "../../models/SidebarSide";
import type { SidebarVariant } from "../../models/SidebarVariant";
import { SidebarLayoutService } from "../../services/sidebar-layout.service";
import { SidebarService } from "../../services/sidebar.service";
import { sidebarBorderAllowance, sidebarThemeVariants } from "../../styles/sidebar.styles";

/** What stays usable or looks after itself beside an open drawer: the backdrop, other sidebars and the focus trap's stops. */
const keepBesideDrawer = (element: Element): boolean =>
    element.localName === "mona-sidebar" ||
    element.hasAttribute("data-sidebar-backdrop") ||
    element.classList.contains("cdk-focus-trap-anchor");

const railTooltipTextOf = (element: HTMLElement): string => element.getAttribute("data-sidebar-tooltip") ?? "";

/** Where a part of the sidebar has gone out of reach while it collapses. */
const OUT_OF_REACH_SELECTOR = "[inert], [data-hidden='true']";

/**
 * @description
 * The sidebar region itself. Content is projected in author order, so header, content and footer
 * parts appear exactly where they are written.
 *
 * Below the layout's `mobileBreakpoint` it presents as a modal overlay drawer: focus is trapped
 * inside it while open, restored to whatever opened it on close, and everything outside it is made
 * inert, as far as the layout's `modalScope` says. It is not a navigation landmark by itself — wrap
 * the menus in a labelled `nav`, or set `role` and `aria-label` if the whole region is navigation.
 */
@Component({
    selector: "mona-sidebar",
    imports: [TooltipDirective],
    // One tooltip for every row on the rail, and off the rail it isn't listening for anything. `contents` keeps the
    // parts laid out by the panel, as if this element weren't here.
    template: `
        <div
            class="contents"
            monaTooltip
            mode="content"
            filter="[data-sidebar-tooltip]"
            [contentOf]="railTooltipText"
            [disabled]="!iconOnly()"
            [position]="railOpensToward()">
            <ng-content></ng-content>
        </div>
    `,
    hostDirectives: [CdkTrapFocus],
    host: {
        "[attr.aria-hidden]": "hidden() ? 'true' : null",
        "[attr.aria-label]": "accessibleName()",
        "[attr.aria-labelledby]": "resolvedRole() ? ariaLabelledBy() || null : null",
        "[attr.aria-modal]": "modal() ? 'true' : null",
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
        // Something for focus to land on when the drawer has no controls, or a press lands on blank space in it.
        "[attr.tabindex]": "drawer() ? -1 : null",
        "[class]": "baseClass()",
        "[style.width]": "widthString()"
    },
    // One service per sidebar, not per layout, so a layout can hold more than one of these and each
    // keeps its own side, width and open state. Descendants resolve the nearest one, which is theirs.
    providers: [SidebarService]
})
export class SidebarComponent {
    readonly #appRef = inject(ApplicationRef);
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #focusTrap = inject(CdkTrapFocus);
    readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #layoutService = inject(SidebarLayoutService, { optional: true });
    readonly #messages = this.#i18n.componentMessages("sidebar", SIDEBAR_DEFAULT_MESSAGES);
    readonly #sidebarService = inject(SidebarService);
    #focusTrapped = false;

    /** Only while there's a role to name. On a plain element a label means nothing, and axe reports it. */
    protected readonly accessibleName = computed(() => {
        if (!this.resolvedRole()) {
            return null;
        }
        return this.ariaLabel() || (this.drawer() && !this.ariaLabelledBy() ? this.#messages().drawerLabel : null);
    });

    protected readonly baseClass = computed(() => {
        const variantClass = sidebarThemeVariants({
            drawer: this.drawer(),
            physicalSide: this.physicalSide(),
            open: this.#sidebarService.mobileOpen(),
            variant: this.variant(),
            flush: this.offCanvasClosed()
        });
        return twMerge(variantClass, this.userClass());
    });

    /** The compact presentation: an overlay pinned to one edge rather than a column in the flow. */
    protected readonly drawer = this.#sidebarService.compact;

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

    protected readonly iconOnly = this.#sidebarService.iconOnly;

    /** Published rather than the raw input, so a `left`/`right` alias still reports as `start`/`end`. */
    protected readonly logicalSide = this.#sidebarService.side;

    /** A drawer scoped to its layout leaves what's around that usable, so it can't claim to be modal. */
    protected readonly modal = computed(
        () => this.drawer() && (this.#layoutService?.modalScope() ?? "page") === "page"
    );

    protected readonly offCanvasClosed = computed(
        () => !this.drawer() && !this.#sidebarService.expanded() && this.collapsible() === "offcanvas"
    );

    protected readonly physicalSide = computed(() =>
        resolvePhysicalSide(this.#direction(), this.#sidebarService.side())
    );

    protected readonly railOpensToward = computed(() => (this.#sidebarService.side() === "start" ? "end" : "start"));

    protected readonly railTooltipText = railTooltipTextOf;

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
            const width = toCssLength(this.mobileWidth());
            // The `sidebar` variant's edge border belongs to its docked form, so its drawer has nothing to allow for.
            return this.variant() === "sidebar" ? width : this.#withBorderAllowance(width);
        }
        if (this.#sidebarService.expanded()) {
            return this.#withBorderAllowance(toCssLength(this.width()));
        }
        // A fully collapsed sidebar is the exception: it has no contents to make room for.
        return this.collapsible() === "icon" ? this.#withBorderAllowance(toCssLength(this.iconWidth())) : "0px";
    });

    /**
     * @description Accessible name for the sidebar region. Required when `role` is set, and used as the
     * drawer's name on compact viewports, which otherwise has a localized default.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description The id of the element that names the sidebar region, in place of `aria-label`. A docked sidebar with no
     * `role` ignores it.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description How the sidebar behaves when collapsed. `"icon"` keeps a narrow rail of icons visible,
     * `"offcanvas"` removes it from the layout entirely, and `"none"` disables collapsing altogether.
     * @default "offcanvas"
     */
    public readonly collapsible = input<SidebarCollapsibleMode>("offcanvas");

    /**
     * @description Sets whether this sidebar is open. Supports two-way binding. While the viewport is
     * compact this reflects the drawer, so one binding drives both presentations, and it reads `false` on
     * a phone from the start. To remember the docked state, use `persistKey` rather than saving this.
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
     * @description Remembers whether this sidebar was left open, under this key. Unset means nothing is
     * stored — no key, no storage written.
     *
     * Only the docked state is kept. A drawer is never restored open: on the viewport that makes one,
     * it would cover the page on load. A stored value wins over `expanded`, and is pushed back out
     * through that binding, so do not set a key on a sidebar whose state is already restored elsewhere.
     *
     * Where it is kept is `SIDEBAR_STORAGE`, which defaults to `localStorage`. A server-rendered
     * application cannot read that until hydration and so flashes the default first; supply storage the
     * server can read through `provideSidebarStorage()`.
     * @default ""
     */
    public readonly persistKey = input("");

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
            const persistKey = this.persistKey();
            const side = this.side();
            const variant = this.variant();
            untracked(() => {
                this.#sidebarService.setCollapsible(collapsible);
                this.#sidebarService.setId(id);
                this.#sidebarService.setPersistKey(persistKey);
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
            onCleanup(layoutService.register(id, this.#sidebarService.controller, this.#host.nativeElement));
        });

        effect(() => {
            const trapped = this.drawer() && this.#sidebarService.mobileOpen();
            untracked(() => this.#setFocusTrapped(trapped));
        });

        effect(onCleanup => {
            if (!this.drawer() || !this.#sidebarService.mobileOpen()) {
                return;
            }
            const modal = this.modal();
            onCleanup(untracked(() => this.#holdOutside(modal)));
        });

        // After the render that takes the part away, and before the browser moves focus to the body because of it.
        afterRenderEffect(() => {
            const expanded = this.#sidebarService.expanded();
            untracked(() => {
                if (!expanded && !this.drawer()) {
                    this.#moveFocusOutOfCollapsedPart();
                }
            });
        });

        afterNextRender(() => this.#warnWithoutName());

        this.#destroyRef.onDestroy(() => {
            if (this.#focusTrapped) {
                const restoreTo = this.#layoutService?.releaseReturnFocus(this.#sidebarService.sidebarId());
                if (restoreTo) {
                    this.#returnFocus(restoreTo, this.#appRef.injector);
                }
            }
        });
    }

    /** Makes everything outside the open drawer inert, up to the layout or across the page, and returns the undo. */
    #holdOutside(modal: boolean): () => void {
        const host = this.#host.nativeElement;
        const release = inertOutside(host, {
            keep: keepBesideDrawer,
            stopAt: modal ? null : host.closest("mona-sidebar-layout")
        });
        if (!modal) {
            return release;
        }
        const scroll = createBlockScrollStrategy(this.#injector);
        scroll.enable();
        return () => {
            release();
            scroll.disable();
        };
    }

    /**
     * Collapsing takes the panel, or a part of it that doesn't fit the rail, away from under focus. It goes to a
     * trigger for this sidebar, or to the rail, rather than falling to the body.
     */
    #moveFocusOutOfCollapsedPart(): void {
        const host = this.#host.nativeElement;
        const active = this.#document.activeElement;
        if (!active || !host.contains(active) || !active.closest(OUT_OF_REACH_SELECTOR)) {
            return;
        }
        const id = this.#sidebarService.sidebarId();
        const candidates = Array.from(this.#document.querySelectorAll<HTMLElement>("[aria-controls]")).filter(
            element => element.getAttribute("aria-controls") === id && !element.closest(OUT_OF_REACH_SELECTOR)
        );
        const target = candidates.find(element => !element.hasAttribute("monaSidebarRail")) ?? candidates[0];
        target?.focus({ preventScroll: true });
    }

    #returnFocus(element: HTMLElement, injector: Injector): void {
        /*
         * Deferred to the next render, not called here. Whatever opened the drawer is almost always
         * behind it, and the region behind it is still `inert` at this point in the change detection
         * pass — `focus()` on an element inside an inert subtree fails silently, which left focus
         * stranded inside the panel that was about to become inert itself.
         */
        afterNextRender(
            () => {
                if (element.isConnected) {
                    element.focus();
                }
            },
            { injector }
        );
    }

    /**
     * The trap is only armed for the drawer. A docked sidebar sits in the page beside its content, and
     * holding focus inside it would leave the keyboard unable to reach the rest of the layout at all.
     */
    #setFocusTrapped(trapped: boolean): void {
        const wasTrapped = this.#focusTrapped;
        this.#focusTrapped = trapped;
        this.#focusTrap.enabled = trapped;
        const host = this.#host.nativeElement;
        if (trapped) {
            const active = this.#document.activeElement;
            this.#layoutService?.holdReturnFocus(active instanceof HTMLElement ? active : null);
            void this.#focusTrap.focusTrap.focusInitialElementWhenReady().then(found => {
                const current = this.#document.activeElement;
                const unmoved = current === active || !current || current === this.#document.body;
                if (!found && unmoved && this.#focusTrapped) {
                    host.focus({ preventScroll: true });
                }
            });
            return;
        }
        if (!wasTrapped) {
            return;
        }

        const restoreTo = this.#layoutService?.releaseReturnFocus(this.#sidebarService.sidebarId());
        const active = this.#document.activeElement;
        // A press on the backdrop leaves focus on the body, which is focus lost rather than focus moved. Pulling it
        // back from anywhere else would yank the caret away from wherever the user has since gone.
        const lost = !active || active === this.#document.body;
        if (restoreTo && (lost || host.contains(active))) {
            this.#returnFocus(restoreTo, this.#injector);
        }
    }

    #warnWithoutName(): void {
        if (isDevMode() && this.role() && !this.ariaLabel() && !this.ariaLabelledBy()) {
            console.warn(`mona-sidebar: role="${this.role()}" needs a name. Set aria-label or aria-labelledby.`);
        }
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
