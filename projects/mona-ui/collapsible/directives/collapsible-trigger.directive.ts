import { computed, Directive, ElementRef, inject } from "@angular/core";
import { CollapsibleToken } from "../models/CollapsibleConfig";

/**
 * @description
 * Toggles the closest `monaCollapsible`. Wires `aria-expanded` / `aria-controls` automatically and
 * only adds `role`, `tabindex` and keyboard handling when the host element is not already interactive.
 */
@Directive({
    selector: "[monaCollapsibleTrigger]",
    host: {
        "[attr.aria-controls]": "collapsible.contentId",
        "[attr.aria-disabled]": "ariaDisabled()",
        "[attr.aria-expanded]": "collapsible.expanded()",
        "[attr.data-state]": "state()",
        "[attr.disabled]": "nativeDisabled()",
        "[attr.role]": "role",
        "[attr.tabindex]": "tabIndex()",
        "[attr.type]": "type",
        "(click)": "onClick()",
        "(keydown.enter)": "onEnterKeydown($event)",
        "(keydown.space)": "onSpaceKeydown($event)"
    }
})
export class CollapsibleTriggerDirective {
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #nativeAnchor = this.#element.tagName === "A";
    readonly #nativeButton =
        this.#element.tagName === "BUTTON" || this.#element.tagName === "INPUT" || this.#element.tagName === "SUMMARY";
    protected readonly ariaDisabled = computed(() => (this.collapsible.disabled() ? "true" : null));
    protected readonly collapsible = inject(CollapsibleToken);
    protected readonly nativeDisabled = computed(() =>
        this.#element.tagName === "BUTTON" && this.collapsible.disabled() ? "" : null
    );
    protected readonly role = this.#nativeButton || this.#nativeAnchor ? null : "button";
    protected readonly state = computed(() => (this.collapsible.expanded() ? "open" : "closed"));
    protected readonly tabIndex = computed(() => {
        if (this.#nativeButton || this.#nativeAnchor) {
            return null;
        }
        return this.collapsible.disabled() ? -1 : 0;
    });
    protected readonly type = this.#element.tagName === "BUTTON" ? "button" : null;

    protected onClick(): void {
        this.collapsible.toggle();
    }

    protected onEnterKeydown(event: Event): void {
        // Buttons and anchors already synthesise a click for Enter.
        if (this.#nativeButton || this.#nativeAnchor) {
            return;
        }
        event.preventDefault();
        this.collapsible.toggle();
    }

    protected onSpaceKeydown(event: Event): void {
        // Buttons already synthesise a click for Space; anchors scroll the page instead.
        if (this.#nativeButton) {
            return;
        }
        event.preventDefault();
        this.collapsible.toggle();
    }
}
