import { Directive, ElementRef, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";

/**
 * @description
 * Toggles the sidebar of the surrounding `mona-sidebar-layout`. Can be placed anywhere inside the
 * layout, including in the inset, and adds no styling of its own.
 *
 * A `button` is the right host and needs nothing further. On any other element the directive supplies
 * the rest of the button contract — `role`, a tab stop, and Enter/Space activation — so a `div` or
 * `span` trigger is still operable by keyboard rather than silently mouse-only.
 */
@Directive({
    selector: "[monaSidebarTrigger]",
    exportAs: "monaSidebarTrigger",
    host: {
        "[attr.aria-controls]": "sidebarId()",
        "[attr.aria-expanded]": "expanded()",
        "[attr.role]": "role",
        "[attr.tabindex]": "tabIndex",
        // Without this a trigger inside a form submits it, because `submit` is a button's default type.
        "[attr.type]": "type",
        "(click)": "onClick()",
        "(keydown.enter)": "onEnterKeydown($event)",
        "(keydown.space)": "onSpaceKeydown($event)"
    }
})
export class SidebarTriggerDirective {
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #nativeAnchor = this.#element.tagName === "A";
    readonly #nativeButton =
        this.#element.tagName === "BUTTON" || this.#element.tagName === "INPUT" || this.#element.tagName === "SUMMARY";
    readonly #sidebarService = inject(SidebarService);
    protected readonly expanded = this.#sidebarService.expanded;
    protected readonly role = this.#nativeButton || this.#nativeAnchor ? null : "button";
    protected readonly sidebarId = this.#sidebarService.sidebarId;
    protected readonly tabIndex = this.#nativeButton || this.#nativeAnchor ? null : 0;
    protected readonly type = this.#element.tagName === "BUTTON" ? "button" : null;

    protected onClick(): void {
        this.#sidebarService.toggle();
    }

    protected onEnterKeydown(event: Event): void {
        // Buttons and anchors already synthesize a click for Enter.
        if (this.#nativeButton || this.#nativeAnchor) {
            return;
        }
        event.preventDefault();
        this.#sidebarService.toggle();
    }

    protected onSpaceKeydown(event: Event): void {
        // Buttons already synthesize a click for Space; anchors scroll the page instead.
        if (this.#nativeButton) {
            return;
        }
        event.preventDefault();
        this.#sidebarService.toggle();
    }
}
