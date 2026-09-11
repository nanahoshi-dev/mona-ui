import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    signal,
    untracked
} from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { injectComponentDirection, type MonaTextDirection } from "@nanahoshi/mona-ui/i18n";
import { twMerge } from "tailwind-merge";
import { SidebarLayoutService } from "../../services/sidebar-layout.service";
import { sidebarBackdropThemeVariants, sidebarLayoutBaseThemeVariants } from "../../styles/sidebar.styles";

export function resolveSidebarLayoutReverse(options: {
    semanticDirection: MonaTextDirection;
    browserCssDirection?: "ltr" | "rtl" | null;
}): boolean {
    const effectiveDirection = options.browserCssDirection ?? options.semanticDirection;
    return effectiveDirection === "rtl";
}

export function resolveSidebarLayoutBaseClass(options: {
    semanticDirection: MonaTextDirection;
    browserCssDirection?: "ltr" | "rtl" | null;
    userClass?: string;
}): string {
    const reverse = resolveSidebarLayoutReverse(options);
    return twMerge(sidebarLayoutBaseThemeVariants({ reverse }), options.userClass ?? "");
}

function getComposedAncestors(startElement: Element): Element[] {
    const chain: Element[] = [];
    let current: Node | null = startElement;

    while (current) {
        if (current instanceof Element) {
            chain.push(current);
        }
        if (current.parentElement) {
            current = current.parentElement;
        } else if (current.parentNode) {
            const parent: Node = current.parentNode;
            if ("host" in parent && (parent as ShadowRoot).host instanceof Element) {
                current = (parent as ShadowRoot).host;
            } else {
                current = parent;
            }
        } else {
            break;
        }
    }

    return chain;
}

/**
 * @description
 * Lays its children out in a row and owns what they share. Project one or more `mona-sidebar`
 * elements and an element marked with `monaSidebarInset` into it. Each sidebar keeps its own open
 * state, on its own `[(expanded)]` binding, so a layout can hold a navigation column on one edge and
 * an inspector on the other.
 *
 * Below `mobileBreakpoint` sidebars present as overlay drawers instead of columns. A drawer has its
 * own open state, so a sidebar collapsed on a desktop does not come back open on a phone, and it is
 * reset whenever the viewport crosses the breakpoint. Only one drawer is open at a time: opening one
 * closes any other, and they share the single backdrop this layout paints behind them.
 */
@Component({
    selector: "mona-sidebar-layout",
    template: `
        <ng-content></ng-content>
        @if (compact()) {
            <div
                [class]="backdropClass()"
                [attr.aria-hidden]="'true'"
                [attr.data-state]="mobileOpen() ? 'open' : 'closed'"
                (click)="onBackdropClick()"></div>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.data-compact]": "compact() ? 'true' : null",
        "[class]": "baseClass()",
        // Escape closes the drawer from anywhere inside the layout, including from within the
        // trapped focus inside the drawer itself.
        "(keydown.escape)": "onEscape($event)"
    },
    providers: [SidebarLayoutService]
})
export class SidebarLayoutComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #layoutService = inject(SidebarLayoutService);
    readonly #matches = signal(false);
    readonly #browserCssDirection = signal<"ltr" | "rtl" | null>(null);

    /** Internal counter tracking compensation recalculation passes for testability. */
    public readonly compensationRefreshCount = signal(0);

    protected readonly backdropClass = computed(() => sidebarBackdropThemeVariants({ open: this.mobileOpen() }));
    protected readonly baseClass = computed(() =>
        resolveSidebarLayoutBaseClass({
            semanticDirection: this.#direction(),
            browserCssDirection: this.#browserCssDirection(),
            userClass: this.userClass()
        })
    );
    protected readonly compact = this.#layoutService.compact;

    /** One backdrop serves every sidebar, because only one of their drawers is ever open. */
    protected readonly mobileOpen = this.#layoutService.anyMobileOpen;

    /**
     * @description Viewport width, in pixels, below which the sidebar presents as an overlay drawer.
     * Set to `0` to keep the docked presentation at every size.
     * @default 768
     */
    public readonly mobileBreakpoint = input(768);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    public constructor() {
        this.#watchBreakpoint();
        this.#watchCssDirection();
    }

    protected onBackdropClick(): void {
        this.#layoutService.closeAll();
    }

    protected onEscape(event: Event): void {
        // Only a drawer is dismissible. A docked sidebar is part of the page, and closing it on
        // Escape would take the key from anything inside it that wanted to handle it.
        if (!this.#layoutService.anyMobileOpen()) {
            return;
        }
        event.preventDefault();
        this.#layoutService.closeAll();
    }

    /**
     * Kept on `matchMedia` rather than a resize listener, so the browser decides when the threshold is
     * crossed and the query is rebuilt only when the breakpoint input itself changes.
     */
    #watchBreakpoint(): void {
        const destroyRef = inject(DestroyRef);

        effect(() => {
            const compact = this.#matches();
            untracked(() => this.#layoutService.setCompact(compact));
        });

        // Server-rendered and jsdom hosts have no media queries; both keep the docked presentation,
        // which is the one that degrades gracefully without JavaScript.
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return;
        }

        let current: MediaQueryList | null = null;
        const onChange = (event: MediaQueryListEvent): void => this.#matches.set(event.matches);
        const detach = (): void => current?.removeEventListener("change", onChange);
        destroyRef.onDestroy(detach);

        effect(() => {
            const breakpoint = this.mobileBreakpoint();
            untracked(() => {
                detach();
                if (breakpoint <= 0) {
                    current = null;
                    this.#matches.set(false);
                    return;
                }
                current = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
                current.addEventListener("change", onChange);
                this.#matches.set(current.matches);
            });
        });
    }

    /**
     * CSS direction compensation contract:
     * Reads computed CSS `direction` to compensate flex-row orientation so that semantic
     * start/end docking matches physical left/right edges.
     * Reactive updates are supported for:
     * 1. Host and composed ancestor `class`, `style`, and `dir` mutations (including through `ShadowRoot` boundaries);
     * 2. Viewport-responsive media query threshold changes via window resize.
     * Dynamic modification of arbitrary stylesheet rules or adoptedStyleSheets without attribute or resize triggers is out of scope.
     */
    #watchCssDirection(): void {
        let updateAncestorObservers = (): void => {};

        const updateCssDirection = (): void => {
            this.compensationRefreshCount.update(c => c + 1);
            if (typeof window === "undefined") {
                this.#browserCssDirection.set(null);
                return;
            }

            const el = this.#host.nativeElement;
            if (!el) {
                this.#browserCssDirection.set(null);
                return;
            }

            try {
                const computedDir = window.getComputedStyle(el).direction;
                if (computedDir === "rtl" || computedDir === "ltr") {
                    this.#browserCssDirection.set(computedDir);
                } else {
                    this.#browserCssDirection.set(null);
                }
            } catch {
                this.#browserCssDirection.set(null);
            }
            updateAncestorObservers();
        };

        updateCssDirection();

        effect(() => {
            this.#direction();
            updateCssDirection();
        });

        afterNextRender(() => {
            updateCssDirection();
        });

        if (typeof MutationObserver !== "undefined") {
            let observedElements = new Set<Element>();
            const observer = new MutationObserver(() => {
                updateCssDirection();
            });

            updateAncestorObservers = (): void => {
                const el = this.#host.nativeElement;
                if (!el) {
                    return;
                }
                const currentAncestors = getComposedAncestors(el);
                const nextSet = new Set(currentAncestors);

                let changed = nextSet.size !== observedElements.size;
                if (!changed) {
                    for (const item of nextSet) {
                        if (!observedElements.has(item)) {
                            changed = true;
                            break;
                        }
                    }
                }

                if (changed) {
                    observer.disconnect();
                    observedElements = nextSet;
                    for (const node of nextSet) {
                        observer.observe(node, {
                            attributes: true,
                            attributeFilter: ["style", "class", "dir"]
                        });
                    }
                }
            };

            updateAncestorObservers();

            afterNextRender(() => {
                updateAncestorObservers();
                updateCssDirection();
            });

            this.#destroyRef.onDestroy(() => {
                observer.disconnect();
            });
        }

        if (typeof window !== "undefined") {
            let resizeRafId: number | null = null;
            const onResize = (): void => {
                if (resizeRafId !== null) {
                    return;
                }
                if (typeof window.requestAnimationFrame === "function") {
                    resizeRafId = window.requestAnimationFrame(() => {
                        resizeRafId = null;
                        updateCssDirection();
                    });
                } else {
                    updateCssDirection();
                }
            };

            window.addEventListener("resize", onResize, { passive: true });

            this.#destroyRef.onDestroy(() => {
                if (resizeRafId !== null && typeof window.cancelAnimationFrame === "function") {
                    window.cancelAnimationFrame(resizeRafId);
                    resizeRafId = null;
                }
                window.removeEventListener("resize", onResize);
            });
        }
    }
}
