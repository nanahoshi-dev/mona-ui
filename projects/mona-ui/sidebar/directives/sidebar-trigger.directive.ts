import { afterNextRender, computed, Directive, ElementRef, inject, input, isDevMode, signal } from "@angular/core";
import type { SidebarController } from "../models/SidebarController";
import { SidebarLayoutService } from "../services/sidebar-layout.service";
import { SidebarService } from "../services/sidebar.service";

/**
 * @description
 * Toggles a sidebar. Can be placed anywhere inside a `mona-sidebar-layout`, including in the inset,
 * and adds no styling of its own.
 *
 * By default it drives the sidebar it is written inside. Set `for` to the id of a `mona-sidebar` to
 * drive that one instead, which is what a trigger in a shared header needs when the layout holds more
 * than one sidebar. A `for` that matches no sidebar leaves the trigger inert rather than throwing, so
 * a sidebar that has not rendered yet does not take the page down with it, and warns in development.
 *
 * A `button` is the right host and needs nothing further. On any other element the directive supplies
 * the rest of the button contract — `role`, a tab stop, and Enter/Space activation — so a `div`, a
 * `span` or an `a` without `href` is still operable by keyboard rather than silently mouse-only.
 *
 * A sidebar that can't collapse has nothing for a trigger to do on a wide viewport, so the trigger
 * reports itself as disabled there rather than as an open disclosure.
 */
@Directive({
    selector: "[monaSidebarTrigger]",
    exportAs: "monaSidebarTrigger",
    host: {
        "[attr.aria-controls]": "sidebarId()",
        "[attr.aria-disabled]": "fixed() ? 'true' : null",
        "[attr.aria-expanded]": "expanded()",
        "[attr.role]": "role()",
        "[attr.tabindex]": "tabIndex()",
        // Without this a trigger inside a form submits it, because `submit` is a button's default type.
        "[attr.type]": "type",
        "(click)": "onClick()",
        "(keydown.enter)": "onEnterKeydown($event)",
        "(keydown.space)": "onSpaceKeydown($event)"
    }
})
export class SidebarTriggerDirective {
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #layoutService = inject(SidebarLayoutService, { optional: true });
    // A binding such as `routerLink` sets `href` after this directive is created, so it's read after the first render.
    readonly #nativeAnchor = signal(false);
    readonly #nativeButton =
        this.#element.tagName === "BUTTON" || this.#element.tagName === "INPUT" || this.#element.tagName === "SUMMARY";
    // Optional, because a trigger aimed at a sidebar by id is usually written outside every sidebar.
    readonly #sidebarService = inject(SidebarService, { optional: true });

    /**
     * The sidebar this trigger drives: the one named by `for`, else the one it is written inside, else
     * the layout's first. That last step is what lets a trigger in the inset or a header go on working
     * without naming anything, which is all a layout with a single sidebar ever needs.
     */
    readonly #targetController = computed<SidebarController | null>(() => {
        const targetId = this.for();
        if (targetId) {
            return this.#layoutService?.getController(targetId) ?? null;
        }
        return this.#sidebarService?.controller ?? this.#layoutService?.primaryController() ?? null;
    });

    // Null rather than false when nothing is targeted: a trigger that controls nothing has no
    // expanded state to report, and claiming one would announce a control that does not exist.
    protected readonly expanded = computed(() =>
        this.fixed() ? null : (this.#targetController()?.expanded() ?? null)
    );
    protected readonly fixed = computed(() => {
        const target = this.#targetController();
        return target?.collapsible() === "none" && !target.compact();
    });
    protected readonly role = computed(() => (this.#nativeButton || this.#nativeAnchor() ? null : "button"));
    protected readonly sidebarId = computed(() => this.#targetController()?.sidebarId() ?? null);
    protected readonly tabIndex = computed(() => (this.#nativeButton || this.#nativeAnchor() ? null : 0));
    protected readonly type = this.#element.tagName === "BUTTON" ? "button" : null;

    /**
     * @description Id of the `mona-sidebar` to toggle. Leave unset to toggle the sidebar this trigger
     * is written inside.
     * @default ""
     */
    public readonly for = input("");

    public constructor() {
        this.#nativeAnchor.set(this.#element.tagName === "A" && this.#element.hasAttribute("href"));
        afterNextRender(() => {
            this.#nativeAnchor.set(this.#element.tagName === "A" && this.#element.hasAttribute("href"));
            if (isDevMode() && this.for() && !this.#targetController()) {
                console.warn(
                    `monaSidebarTrigger: no sidebar with the id "${this.for()}" in this layout. A trigger can only reach ` +
                        "a sidebar in its own mona-sidebar-layout."
                );
            }
        });
    }

    protected onClick(): void {
        this.#targetController()?.toggle();
    }

    protected onEnterKeydown(event: Event): void {
        // Buttons and links already synthesize a click for Enter.
        if (this.#nativeButton || this.#nativeAnchor()) {
            return;
        }
        event.preventDefault();
        this.#targetController()?.toggle();
    }

    protected onSpaceKeydown(event: Event): void {
        // Buttons already synthesize a click for Space; anchors scroll the page instead.
        if (this.#nativeButton) {
            return;
        }
        event.preventDefault();
        this.#targetController()?.toggle();
    }
}
