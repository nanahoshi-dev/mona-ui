import { isSignal, signal, type WritableSignal } from "@angular/core";
import { forEach, select } from "@mirei/ts-collections";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { Subject } from "rxjs";
import {
    PopupMenuConfig,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuTemplateOrigin,
    PopupMenuTemplateType,
    PopupTemplateConfig
} from "../models/PopupMenuConfig";
import type { MenuItem, PopupMenuItem } from "../models/PopupMenuItem";
import type { PopupMenuItemClickEvent } from "../models/PopupMenuItemClickEvent";
import type { PopupMenuItemGroup } from "../models/PopupMenuItemGroup";

const itemTypeMap: Record<PopupMenuItemType, string> = {
    [PopupMenuItemType.CheckboxMenuItem]: "checkbox",
    [PopupMenuItemType.MenuGroup]: "group",
    [PopupMenuItemType.MenuItem]: "item",
    [PopupMenuItemType.RadioGroup]: "radio-group",
    [PopupMenuItemType.RadioItem]: "radio",
    [PopupMenuItemType.Separator]: "separator"
};

const templateItemTypeMap: Record<PopupMenuTemplateType, string> = {
    [PopupMenuTemplateType.Group]: "group",
    [PopupMenuTemplateType.Icon]: "icon",
    [PopupMenuTemplateType.Shortcut]: "shortcut",
    [PopupMenuTemplateType.Text]: "text"
};

export const ensurePopupComponentTypes = (params: {
    components: Iterable<PopupMenuConfig>;
    componentTypeMap: Record<PopupMenuItemType, string>;
    origin: PopupMenuOrigin;
    prefix: string;
}): void => {
    forEach(params.components, item => {
        if (item.origin !== params.origin) {
            const type = item.type;
            const expectedItemType = itemTypeMap[type];
            const expectedComponentType = params.componentTypeMap[type];
            throw new Error(`${params.prefix}: The ${expectedItemType} must be defined with ${expectedComponentType}.`);
        }
    });
};

export const ensurePopupTemplateTypes = (params: {
    templates: Iterable<PopupTemplateConfig>;
    templateTypeMap: Record<PopupMenuTemplateType, string>;
    origin: PopupMenuTemplateOrigin;
    prefix: string;
}): void => {
    forEach(params.templates, item => {
        if (item.origin !== params.origin) {
            const type = item.type;
            const expectedTemplateType = params.templateTypeMap[type];
            throw new Error(
                `${params.prefix}: The ${templateItemTypeMap[type]} template must be defined with ${expectedTemplateType}.`
            );
        }
    });
};

// One id per `MenuItem` object, so a menu rebuilt from the same objects keeps track of its items.
const menuItemUids = new WeakMap<MenuItem, string>();

const menuItemUid = (item: MenuItem): string => {
    let uid = menuItemUids.get(item);
    if (!uid) {
        uid = createElementControlId();
        menuItemUids.set(item, uid);
    }
    return uid;
};

export const preparePopupMenuItems = (items: Iterable<MenuItem>): PopupMenuItem[] => {
    return select(items, item => {
        const popupItem: PopupMenuItem = {
            checkable: item.checkable ?? false,
            checked: signal(item.checked ?? false),
            click$: new Subject<PopupMenuItemClickEvent>(),
            disabled: item.disabled ?? false,
            // An ungrouped item gets a key of its own, so it never joins another item's group.
            group: item.group ?? Symbol(),
            groupTemplate: null,
            iconTemplate: null,
            items: preparePopupMenuItems(item.items ?? []),
            label: item.label ?? "",
            separator: item.separator ?? false,
            shortcutTemplate: null,
            textTemplate: null,
            uid: menuItemUid(item),
            value: signal(item.value)
        };
        return popupItem;
    }).toArray();
};

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
