import type { PopupMenuItem } from "./PopupMenuItem";

/** A run of consecutive menu items that share a group key. */
export interface PopupMenuItemGroup {
    readonly items: readonly PopupMenuItem[];
    readonly key: string | symbol;
    /** The id of the group's title element, when it has a title. */
    readonly labelId: string;
    /** The group's title: a string key, or a symbol key's description. Empty for ungrouped items. */
    readonly title: string;
}
