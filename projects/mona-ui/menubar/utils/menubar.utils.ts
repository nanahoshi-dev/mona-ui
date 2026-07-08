import {
    ensurePopupComponentTypes,
    ensurePopupTemplateTypes,
    PopupMenuConfig,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuTemplateOrigin,
    PopupMenuTemplateType,
    PopupTemplateConfig
} from "@mirei/mona-ui/popup-menu";

const componentTypeMap: Record<PopupMenuItemType, string> = {
    [PopupMenuItemType.CheckboxMenuItem]: "mona-menu-checkbox-item",
    [PopupMenuItemType.MenuGroup]: "mona-menu-group",
    [PopupMenuItemType.MenuItem]: "mona-menu-item",
    [PopupMenuItemType.RadioGroup]: "mona-menu-radio-group",
    [PopupMenuItemType.RadioItem]: "mona-menu-radio-item",
    [PopupMenuItemType.Separator]: "mona-menu-separator"
};

const templateTypeMap: Record<PopupMenuTemplateType, string> = {
    [PopupMenuTemplateType.Group]: "monaMenubarMenuGroupTemplate",
    [PopupMenuTemplateType.Icon]: "monaMenubarMenuItemIconTemplate",
    [PopupMenuTemplateType.Shortcut]: "monaMenubarMenuItemShortcutTemplate",
    [PopupMenuTemplateType.Text]: "monaMenubarMenuItemTextTemplate"
};

export const ensureMenubarComponentTypes = (components: Iterable<PopupMenuConfig>): void => {
    ensurePopupComponentTypes({
        components,
        componentTypeMap,
        origin: PopupMenuOrigin.MenubarMenu,
        prefix: "mona-menu"
    });
};

export const ensureMenubarTemplateTypes = (templates: Iterable<PopupTemplateConfig>): void => {
    ensurePopupTemplateTypes({
        templates,
        templateTypeMap,
        origin: PopupMenuTemplateOrigin.MenubarMenu,
        prefix: "mona-menu"
    });
};
