import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    input,
    model,
    signal,
    untracked
} from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { SidebarService } from "../../services/sidebar.service";
import { sidebarBackdropThemeVariants, sidebarLayoutBaseThemeVariants } from "../../styles/sidebar.styles";

/**
 * @description
 * Provides the shared sidebar state and lays its children out in a row. Project a `mona-sidebar`
 * and an element marked with `monaSidebarInset` into it.
 *
 * Below `mobileBreakpoint` the sidebar presents as an overlay drawer instead of a column. The drawer
 * has its own open state, so a sidebar collapsed on a desktop does not come back open on a phone,
 * and it is reset whenever the viewport crosses the breakpoint.
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
    providers: [SidebarService]
})
export class SidebarLayoutComponent {
    readonly #matches = signal(false);
    readonly #sidebarService = inject(SidebarService);
    protected readonly backdropClass = computed(() => sidebarBackdropThemeVariants({ open: this.mobileOpen() }));
    protected readonly baseClass = computed(() => twMerge(sidebarLayoutBaseThemeVariants(), this.userClass()));
    protected readonly compact = this.#sidebarService.compact;
    protected readonly mobileOpen = this.#sidebarService.mobileOpen;

    /**
     * @description Sets whether the sidebar is open. Supports two-way binding. While the viewport is
     * compact this reflects the drawer, so one binding drives both presentations.
     * @default true
     */
    public readonly expanded = model(true);

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

        effect(() => {
            const expanded = this.expanded();
            untracked(() => this.#sidebarService.setExpanded(expanded));
        });
        effect(() => {
            const expanded = this.#sidebarService.expanded();
            untracked(() => this.expanded.set(expanded));
        });
    }

    protected onBackdropClick(): void {
        this.#sidebarService.collapse();
    }

    protected onEscape(event: Event): void {
        // Only the drawer is dismissible. A docked sidebar is part of the page, and closing it on
        // Escape would take the key from anything inside it that wanted to handle it.
        if (!this.#sidebarService.mobileOpen()) {
            return;
        }
        event.preventDefault();
        this.#sidebarService.collapse();
    }

    /**
     * Kept on `matchMedia` rather than a resize listener, so the browser decides when the threshold is
     * crossed and the query is rebuilt only when the breakpoint input itself changes.
     */
    #watchBreakpoint(): void {
        const destroyRef = inject(DestroyRef);

        effect(() => {
            const compact = this.#matches();
            untracked(() => this.#sidebarService.setCompact(compact));
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
}
