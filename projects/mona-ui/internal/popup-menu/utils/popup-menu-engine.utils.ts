import { signal } from "@angular/core";
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
