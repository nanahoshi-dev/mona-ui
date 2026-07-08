import { PreventableEvent } from "@mirei/mona-ui/common";
import { PopupMenuItem } from "./PopupMenuItem";

export class PopupMenuItemClickEvent extends PreventableEvent {
    readonly #item: PopupMenuItem;
    public constructor(item: PopupMenuItem, originalEvent: MouseEvent) {
        super("popupMenuItemClick", originalEvent);
        this.#item = item;
    }

    public get item(): PopupMenuItem {
        return this.#item;
    }
}
