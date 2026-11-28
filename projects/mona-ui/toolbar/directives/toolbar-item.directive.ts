import { Directive, ElementRef, inject, input, output, signal } from "@angular/core";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { ToolbarItemOverflow } from "../models/ToolbarItemOverflow";

/**
 * @description Marks a control directly inside `<mona-toolbar>` as one that moves into the toolbar's More menu when
 * there's no room for it, last ones first. In the menu it's an item with the control's text, disabled with it and
 * checked while it's pressed, and choosing it clicks the control once the menu has closed and the focus is back on the
 * More button.
 */
@Directive({
    selector: "[monaToolbarItem]"
})
export class ToolbarItemDirective {
    readonly #hidden = signal(false);

    /** @hidden */
    public readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /**
     * Whether the item is in the More menu rather than in the toolbar.
     * @hidden
     */
    public readonly hidden = this.#hidden.asReadonly();

    /**
     * @description Whether the item can move into the More menu: `auto` when there's no room for it, `never` to keep it in
     * the toolbar, such as a search box.
     * @default "auto"
     */
    public readonly overflow = input<ToolbarItemOverflow, ToolbarItemOverflow | "" | null | undefined>("auto", {
        alias: "monaToolbarItem",
        transform: toOverflow
    });

    /**
     * @description Emitted when the item is chosen from the More menu, once the menu has closed and the focus is back on
     * the More button. Unless it's prevented, the toolbar then clicks the control, which suits a button. Handle it for a
     * control a click doesn't operate, or keep that control in the toolbar with `overflow="never"`.
     */
    public readonly overflowActivate = output<PreventableEvent<Event>>();

    /**
     * @description The item's text in the More menu. Without it, the menu uses the control's `aria-label`, then its text.
     * @default ""
     */
    public readonly overflowText = input("");

    /**
     * Runs the item's action for its menu item: `overflowActivate`, then a click unless that's prevented.
     * @hidden
     */
    public activate(originalEvent?: Event): void {
        const event = new PreventableEvent<Event>("toolbarItemOverflowActivate", originalEvent);
        this.overflowActivate.emit(event);
        if (!event.isDefaultPrevented()) {
            this.element.click();
        }
    }
    /**
     * The item's text in the More menu.
     * @hidden
     */
    public getMenuText(): string {
        const text = this.overflowText() || this.element.getAttribute("aria-label") || this.element.textContent;
        return text?.replace(/\s+/g, " ").trim() ?? "";
    }

    /**
     * Whether the control can't be operated, so its menu item can't either.
     * @hidden
     */
    public isDisabled(): boolean {
        return (
            (this.element as HTMLButtonElement).disabled === true ||
            this.element.getAttribute("aria-disabled") === "true"
        );
    }

    /**
     * Whether the item is a divider, which the menu draws as its own.
     * @hidden
     */
    public isSeparator(): boolean {
        return this.element.getAttribute("role") === "separator" || this.element.tagName === "MONA-SEPARATOR";
    }

    /**
     * The control's pressed state, or `null` for a control that isn't a toggle.
     * @hidden
     */
    public pressed(): boolean | null {
        const pressed = this.element.getAttribute("aria-pressed");
        return pressed == null ? null : pressed === "true";
    }

    /**
     * Shows or hides the item in the toolbar at once, so the toolbar can measure what fits in the same frame.
     * @hidden
     */
    public setHidden(hidden: boolean): void {
        if (this.element.hidden !== hidden) {
            this.element.hidden = hidden;
        }
        // The hidden attribute alone loses to a display class on the control.
        const display = hidden ? "none" : "";
        if (this.element.style.display !== display) {
            this.element.style.display = display;
        }
        this.#hidden.set(hidden);
    }
}

function toOverflow(value: ToolbarItemOverflow | "" | null | undefined): ToolbarItemOverflow {
    return value === "never" ? "never" : "auto";
}
