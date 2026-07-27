import { computed, Directive, ElementRef, inject, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import type { SidebarMenuButtonSize } from "../models/SidebarMenuButtonSize";
import { SidebarService } from "../services/sidebar.service";
import { sidebarMenuButtonThemeVariants } from "../styles/sidebar.styles";
import { SidebarMenuItemDirective } from "./sidebar-menu-item.directive";

/**
 * @description
 * A row in a sidebar menu. Applies to a `button` for an action and to an `a` for a destination —
 * an anchor keeps `href`, `routerLink`, middle-click, open-in-new-tab and the browser's own status
 * bar preview, none of which a button can offer.
 *
 * On a compact viewport, following a link closes the drawer, since the destination it navigates to is
 * underneath it.
 */
@Directive({
    selector: "a[monaSidebarMenuButton], button[monaSidebarMenuButton]",
    exportAs: "monaSidebarMenuButton",
    host: {
        "[attr.aria-current]": "current()",
        "[attr.aria-disabled]": "ariaDisabled()",
        "[attr.disabled]": "nativeDisabled()",
        // An anchor without an `href` is not focusable or clickable, so a disabled link has to be
        // given back a tab stop to stay announceable, and its activation suppressed instead.
        "[attr.tabindex]": "tabIndex()",
        "[attr.title]": "railTitle()",
        "[attr.type]": "type",
        "[class]": "baseClass()",
        "(click)": "onClick($event)"
    }
})
export class SidebarMenuButtonDirective {
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #menuItem = inject(SidebarMenuItemDirective, { optional: true });
    readonly #nativeButton = this.#element.tagName === "BUTTON";
    readonly #sidebarService = inject(SidebarService, { optional: true });

    protected readonly ariaDisabled = computed(() => (this.disabled() ? "true" : null));

    protected readonly baseClass = computed(() => {
        const variantClass = sidebarMenuButtonThemeVariants({
            active: this.#menuItem?.active() ?? false,
            disabled: this.disabled(),
            iconOnly: this.railBox(),
            size: this.size()
        });
        return twMerge(variantClass, this.userClass());
    });

    /**
     * Marks the row the user is currently on. `page` regardless of host element: `active` describes a
     * destination, and a sidebar built from buttons rather than anchors is still a set of destinations
     * as far as a screen reader is concerned.
     */
    protected readonly current = computed(() => ((this.#menuItem?.active() ?? false) ? "page" : null));

    protected readonly nativeDisabled = computed(() => (this.#nativeButton && this.disabled() ? "" : null));

    /**
     * On the rail the row becomes a square exactly the size of its leading visual and clips its own
     * overflow, so any label is pushed out of view instead of competing for space.
     */
    protected readonly railBox = computed(() => this.#sidebarService?.iconOnly() ?? false);

    // The label is clipped away on the rail, so the leading visual needs something to identify it. Only
    // set there, so the title never duplicates a label that is already legible.
    protected readonly railTitle = computed(() => {
        const tooltip = this.tooltip();
        return tooltip && this.railBox() ? tooltip : null;
    });

    protected readonly tabIndex = computed(() => (this.disabled() && !this.#nativeButton ? 0 : null));

    // Guards against a sidebar row inside a form submitting it.
    protected readonly type = this.#nativeButton ? "button" : null;

    /**
     * @description Closes the overlay drawer after this row is activated. Only applies on compact
     * viewports, where the drawer covers the destination being navigated to. Set to `false` for rows
     * that do not navigate, such as a disclosure trigger.
     * @default true
     */
    public readonly closeOnSelect = input(true);

    /**
     * @description Renders the row as unavailable and suppresses activation.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description How much room this row's leading visual needs. Use `"large"` when it opens with
     * something avatar sized, so the icon rail lets it fill the square instead of insetting and clipping it.
     * @default "medium"
     */
    public readonly size = input<SidebarMenuButtonSize>("medium");

    /**
     * @description Text identifying this item while the sidebar is collapsed to its icon rail, where the
     * label is clipped away. Applied as the host's `title`, so the browser surfaces it on hover, and an
     * ancestor carrying `monaTooltip` with `mode="content"` renders it as a styled tooltip instead.
     * @default ""
     */
    public readonly tooltip = input("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    protected onClick(event: Event): void {
        if (this.disabled()) {
            // `aria-disabled` is advisory: an anchor with an `href` still navigates without this.
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        if (this.closeOnSelect() && this.#sidebarService?.mobileOpen()) {
            this.#sidebarService.collapse();
        }
    }
}
