import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { PopupMenuItem } from "./PopupMenuItem";

/**
 * Emitted when a menu item is activated by a click, Enter or Space. Preventing it keeps the menu open and leaves a
 * checkbox or radio item's state unchanged.
 */
export class PopupMenuItemClickEvent extends PreventableEvent {
    readonly #checked: boolean | undefined;
    readonly #contextElement: HTMLElement | null;
    readonly #item: PopupMenuItem;

    public constructor(item: PopupMenuItem, originalEvent: MouseEvent, contextElement: HTMLElement | null = null) {
        super("popupMenuItemClick", originalEvent);
        this.#item = item;
        this.#contextElement = contextElement;
        if (item.checkable) {
            this.#checked = !(item.checked?.() ?? false);
        } else if (item.radio) {
            this.#checked = true;
        }
    }

    /**
     * For a checkbox or radio item, the state the item has once the click is applied (if it isn't prevented).
     * `undefined` for other items.
     */
    public get checked(): boolean | undefined {
        return this.#checked;
    }

    /**
     * The element in the menu's target that the menu opened on, as the menu's `contextElement` gave it when this menu
     * opened: for a context menu, the element under the pointer, or, from the ContextMenu key or Shift+F10, the
     * element that had the focus; with a `filter`, the element around it that matched. `null` when the event didn't
     * come from a menu.
     */
    public get contextElement(): HTMLElement | null {
        return this.#contextElement;
    }

    /**
     * The activated item, as the menu holds it. The event's `label` and `value` read from it.
     * @hidden
     */
    public get item(): PopupMenuItem {
        return this.#item;
    }

    /**
     * The item's label.
     */
    public get label(): string {
        return this.#item.label;
    }

    /**
     * The item's `value`: the `value` input of the item component, or the `value` of a `MenuItem`.
     */
    public get value(): unknown {
        return this.#item.value?.();
    }
}
