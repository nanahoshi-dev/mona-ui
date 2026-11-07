import { computed, Directive, ElementRef, inject } from "@angular/core";
import { COLLAPSIBLE_CONFIG } from "../models/CollapsibleConfig";

/** What inside a trigger keeps its own clicks and keys. */
const NESTED_CONTROL_SELECTOR = "a[href], button, input, select, summary, textarea, [contenteditable], [tabindex]";

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
        "(click)": "onClick($event)",
        "(keydown.enter)": "onEnterKeydown($event)",
        "(keydown.space)": "onSpaceKeydown($event)"
    }
})
export class CollapsibleTriggerDirective {
    readonly #element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #nativeAnchor = this.#element.tagName === "A";
    readonly #nativeButton =
        this.#element.tagName === "BUTTON" || this.#element.tagName === "INPUT" || this.#element.tagName === "SUMMARY";
    readonly #nativeDisableable = this.#element.tagName === "BUTTON" || this.#element.tagName === "INPUT";
    readonly #nativeSummary = this.#element.tagName === "SUMMARY";
    protected readonly ariaDisabled = computed(() => (this.collapsible.disabled() ? "true" : null));
    protected readonly collapsible = inject(COLLAPSIBLE_CONFIG);
    protected readonly nativeDisabled = computed(() =>
        this.#nativeDisableable && this.collapsible.disabled() ? "" : null
    );
    protected readonly role = this.#nativeButton || this.#nativeAnchor ? null : "button";
    protected readonly state = computed(() => (this.collapsible.expanded() ? "open" : "closed"));
    protected readonly tabIndex = computed(() => {
        if (this.#nativeButton) {
            return null;
        }
        if (this.collapsible.disabled()) {
            return -1;
        }
        return this.#nativeAnchor ? null : 0;
    });
    protected readonly type = this.#element.tagName === "BUTTON" ? "button" : null;

    protected onClick(event: Event): void {
        if (this.#isFromNestedControl(event)) {
            return;
        }
        if ((this.#nativeAnchor || this.#nativeSummary) && this.collapsible.disabled()) {
            // A button's `disabled` stops this by itself. An anchor would follow its `href`, and a summary open its details.
            event.preventDefault();
            return;
        }
        this.collapsible.toggle();
    }

    protected onEnterKeydown(event: Event): void {
        // Buttons and anchors already synthesise a click for Enter.
        if (this.#nativeButton || this.#nativeAnchor || this.#isFromNestedControl(event)) {
            return;
        }
        event.preventDefault();
        this.collapsible.toggle();
    }

    protected onSpaceKeydown(event: Event): void {
        // Buttons already synthesise a click for Space; anchors scroll the page instead.
        if (this.#nativeButton || this.#isFromNestedControl(event)) {
            return;
        }
        event.preventDefault();
        this.collapsible.toggle();
    }

    #isFromNestedControl(event: Event): boolean {
        const control = (event.target as Element).closest(NESTED_CONTROL_SELECTOR);
        return control !== null && control !== this.#element && this.#element.contains(control);
    }
}
