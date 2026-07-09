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
    [PopupMenuItemType.CheckboxMenuItem]: "mona-dropdown-button-checkbox-item",
    [PopupMenuItemType.MenuGroup]: "mona-dropdown-button-group",
    [PopupMenuItemType.MenuItem]: "mona-dropdown-button-item",
    [PopupMenuItemType.RadioGroup]: "mona-dropdown-button-radio-group",
    [PopupMenuItemType.RadioItem]: "mona-dropdown-button-radio-item",
    [PopupMenuItemType.Separator]: "mona-dropdown-button-separator"
};

const templateTypeMap: Record<PopupMenuTemplateType, string> = {
    [PopupMenuTemplateType.Group]: "monaDropdownButtonMenuGroupTemplate",
    [PopupMenuTemplateType.Icon]: "monaDropdownButtonMenuItemIconTemplate",
    [PopupMenuTemplateType.Shortcut]: "monaDropdownButtonMenuItemShortcutTemplate",
    [PopupMenuTemplateType.Text]: "monaDropdownButtonMenuItemTextTemplate"
};

export const ensureDropdownButtonComponentTypes = (components: Iterable<PopupMenuConfig>): void => {
    ensurePopupComponentTypes({
        components,
        componentTypeMap,
        origin: PopupMenuOrigin.DropdownButton,
        prefix: "mona-dropdown-button"
    });
};

export const ensureDropdownButtonTemplateTypes = (templates: Iterable<PopupTemplateConfig>): void => {
    ensurePopupTemplateTypes({
        templates,
        templateTypeMap,
        origin: PopupMenuTemplateOrigin.DropdownButton,
        prefix: "mona-dropdown-button"
    });
};
