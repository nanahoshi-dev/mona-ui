import {
    afterRenderEffect,
    computed,
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    input,
    untracked
} from "@angular/core";
import { CollapsibleTriggerDirective } from "@nanahoshi/mona-ui/collapsible";
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
 * underneath it. A row that opens a submenu leaves the drawer open, and on the icon rail it expands the
 * sidebar, since that's the only place the submenu can open.
 */
@Directive({
    selector: "a[monaSidebarMenuButton], button[monaSidebarMenuButton]",
    exportAs: "monaSidebarMenuButton",
    host: {
        "[attr.aria-current]": "current()",
        "[attr.aria-disabled]": "ariaDisabled()",
        "[attr.data-sidebar-tooltip]": "railTooltip()",
        "[attr.disabled]": "nativeDisabled()",
        "[attr.role]": "role()",
        // An anchor without an `href` is not focusable or clickable, so a disabled link has to be
        // given back a tab stop to stay announceable, and its activation suppressed instead.
        "[attr.tabindex]": "tabIndex()",
        "[attr.type]": "type",
        "[class]": "baseClass()",
        "(click)": "onClick()"
    }
})
export class SidebarMenuButtonDirective {
    readonly #authoredRole: string | null;
    readonly #collapsibleTrigger = inject(CollapsibleTriggerDirective, { optional: true, self: true });
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #menuItem = inject(SidebarMenuItemDirective, { optional: true });
    readonly #nativeButton = this.#element.tagName === "BUTTON";
    readonly #sidebarService = inject(SidebarService, { optional: true });
    #disabledHref: string | null = null;

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
    // set there, so the tooltip never duplicates a label that is already legible. `mona-sidebar` shows it.
    protected readonly railTooltip = computed(() => {
        const tooltip = this.tooltip();
        return tooltip && this.railBox() ? tooltip : null;
    });

    // Without its `href` an anchor is no longer a link, so a disabled one has to say so itself.
    protected readonly role = computed(() =>
        this.disabled() && !this.#nativeButton ? (this.#authoredRole ?? "link") : this.#authoredRole
    );

    protected readonly tabIndex = computed(() => (this.disabled() && !this.#nativeButton ? 0 : null));

    // Guards against a sidebar row inside a form submitting it.
    protected readonly type = this.#nativeButton ? "button" : null;

    /**
     * @description Closes the overlay drawer after this row is activated. Only applies on compact
     * viewports, where the drawer covers the destination being navigated to. Set to `false` for rows
     * that do not navigate. Leave it unset on a `monaCollapsibleTrigger`, which keeps the drawer open.
     * @default true, or false on a `monaCollapsibleTrigger`
     */
    public readonly closeOnSelect = input<boolean | undefined>(undefined);

    /**
     * @description Renders the row as unavailable and suppresses activation, including a `routerLink` and any `click`
     * handler on it. A disabled anchor gives up its `href`.
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
     * label is clipped away. Shown as a tooltip on hover and on keyboard focus, on the rail only.
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

    public constructor() {
        this.#authoredRole = this.#element.getAttribute("role");

        /*
         * Angular merges every listener for one event on one element into a single DOM listener, so stopping the event
         * from inside one of them stops none of the others, `RouterLink`'s among them. This one runs ahead of that.
         */
        const suppressWhileDisabled = (event: Event): void => {
            if (this.disabled()) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };
        this.#element.addEventListener("click", suppressWhileDisabled, { capture: true });
        inject(DestroyRef).onDestroy(() =>
            this.#element.removeEventListener("click", suppressWhileDisabled, { capture: true })
        );

        // After the render, because `RouterLink` sets `href` from its own binding.
        afterRenderEffect(() => {
            const disabled = this.disabled();
            untracked(() => this.#syncDisabledHref(disabled));
        });
    }

    protected onClick(): void {
        if (this.railBox() && this.#collapsibleTrigger) {
            this.#sidebarService?.expand();
            return;
        }
        const closes = this.closeOnSelect() ?? !this.#collapsibleTrigger;
        if (closes && this.#sidebarService?.mobileOpen()) {
            this.#sidebarService.collapse();
        }
    }

    #syncDisabledHref(disabled: boolean): void {
        if (this.#nativeButton) {
            return;
        }
        if (disabled) {
            const href = this.#element.getAttribute("href");
            if (href !== null) {
                this.#disabledHref = href;
                this.#element.removeAttribute("href");
            }
        } else if (this.#disabledHref !== null) {
            if (!this.#element.hasAttribute("href")) {
                this.#element.setAttribute("href", this.#disabledHref);
            }
            this.#disabledHref = null;
        }
    }
}
