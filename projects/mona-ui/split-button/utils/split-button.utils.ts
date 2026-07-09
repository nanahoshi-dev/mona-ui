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
    [PopupMenuItemType.CheckboxMenuItem]: "mona-split-button-checkbox-item",
    [PopupMenuItemType.MenuGroup]: "mona-split-button-group",
    [PopupMenuItemType.MenuItem]: "mona-split-button-item",
    [PopupMenuItemType.RadioGroup]: "mona-split-button-radio-group",
    [PopupMenuItemType.RadioItem]: "mona-split-button-radio-item",
    [PopupMenuItemType.Separator]: "mona-split-button-separator"
};

const templateTypeMap: Record<PopupMenuTemplateType, string> = {
    [PopupMenuTemplateType.Group]: "monaSplitButtonMenuGroupTemplate",
    [PopupMenuTemplateType.Icon]: "monaSplitButtonMenuItemIconTemplate",
    [PopupMenuTemplateType.Shortcut]: "monaSplitButtonMenuItemShortcutTemplate",
    [PopupMenuTemplateType.Text]: "monaSplitButtonMenuItemTextTemplate"
};

export const ensureSplitButtonComponentTypes = (components: Iterable<PopupMenuConfig>): void => {
    ensurePopupComponentTypes({
        components,
        componentTypeMap,
        origin: PopupMenuOrigin.SplitButton,
        prefix: "mona-split-button"
    });
};

export const ensureSplitButtonTemplateTypes = (templates: Iterable<PopupTemplateConfig>): void => {
    ensurePopupTemplateTypes({
        templates,
        templateTypeMap,
        origin: PopupMenuTemplateOrigin.SplitButton,
        prefix: "mona-split-button"
    });
};
