import { isSignal, type WritableSignal } from "@angular/core";
import { select } from "@mirei/ts-collections";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import type { MenuItem, PopupMenuItem } from "@nanahoshi/mona-ui/internal/popup-menu";
import type { PopupMenuItemGroup } from "../models/PopupMenuItemGroup";

export const convertToMenuItem = (item: PopupMenuItem): MenuItem => {
    return {
        checkable: item.checkable,
        checked: item.checked ? item.checked() : false,
        disabled: item.disabled,
        group: typeof item.group === "string" ? item.group || undefined : item.group.description || undefined,
        items: select(item.items, i => convertToMenuItem(i)).toArray(),
        label: item.label,
        separator: item.separator,
        value: item.value?.()
    };
};

/**
 * Groups consecutive items that share a group key, keeping the items' order. Items with the same key that aren't
 * next to each other form separate groups.
 */
export const groupPopupMenuItems = (items: Iterable<PopupMenuItem>): PopupMenuItemGroup[] => {
    const groups: { items: PopupMenuItem[]; key: string | symbol }[] = [];
    for (const item of items) {
        const last = groups.at(-1);
        if (last && last.key === item.group) {
            last.items.push(item);
        } else {
            groups.push({ items: [item], key: item.group });
        }
    }
    return groups.map(group => {
        const title = typeof group.key === "string" ? group.key : (group.key.description ?? "");
        return { items: group.items, key: group.key, labelId: title ? createElementControlId() : "", title };
    });
};

/**
 * Whether the item's checked state is held by the menu (a checkable `MenuItem` from the `items` input), so the
 * menu toggles it when the item is activated.
 */
export const isMenuOwnedCheckState = (
    item: PopupMenuItem
): item is PopupMenuItem & { checked: WritableSignal<boolean> } => {
    return item.checkable === true && isSignal(item.checked) && "set" in item.checked;
};
