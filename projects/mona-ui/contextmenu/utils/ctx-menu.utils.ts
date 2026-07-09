import {
    ensurePopupComponentTypes,
    ensurePopupTemplateTypes,
    PopupMenuConfig,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuTemplateOrigin,
    PopupMenuTemplateType,
    PopupTemplateConfig
} from "@nanahoshi/mona-ui/popup-menu";

const componentTypeMap: Record<PopupMenuItemType, string> = {
    [PopupMenuItemType.CheckboxMenuItem]: "mona-contextmenu-checkbox-item",
    [PopupMenuItemType.MenuGroup]: "mona-contextmenu-group",
    [PopupMenuItemType.MenuItem]: "mona-contextmenu-item",
    [PopupMenuItemType.RadioGroup]: "mona-contextmenu-radio-group",
    [PopupMenuItemType.RadioItem]: "mona-contextmenu-radio-item",
    [PopupMenuItemType.Separator]: "mona-contextmenu-separator"
};

const templateTypeMap: Record<PopupMenuTemplateType, string> = {
    [PopupMenuTemplateType.Group]: "monaContextMenuGroupTemplate",
    [PopupMenuTemplateType.Icon]: "monaContextMenuIconTemplate",
    [PopupMenuTemplateType.Shortcut]: "monaContextMenuShortcutTemplate",
    [PopupMenuTemplateType.Text]: "monaContextMenuTextTemplate"
};

export const ensureContextMenuComponentTypes = (components: Iterable<PopupMenuConfig>): void => {
    ensurePopupComponentTypes({
        components,
        componentTypeMap,
        origin: PopupMenuOrigin.ContextMenu,
        prefix: "mona-contextmenu"
    });
};

export const ensureContextMenuTemplateTypes = (templates: Iterable<PopupTemplateConfig>): void => {
    ensurePopupTemplateTypes({
        templates,
        templateTypeMap,
        origin: PopupMenuTemplateOrigin.ContextMenu,
        prefix: "mona-contextmenu"
    });
};
