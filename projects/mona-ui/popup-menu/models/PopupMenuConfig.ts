import { InjectionToken, type TemplateRef } from "@angular/core";
import type { PopupMenuItem } from "./PopupMenuItem";

/* eslint-disable @typescript-eslint/naming-convention -- exported token names; renaming them would break consumers. */
export const PopupMenuToken = new InjectionToken<PopupMenuConfig>("MONA_POPUP_MENU");
export const PopupMenuRadioItemToken = new InjectionToken<PopupMenuConfig>("MONA_POPUP_MENU_RADIO_ITEM");
export const PopupMenuGroupTemplateToken = new InjectionToken<PopupTemplateConfig>("MONA_POPUP_MENU_GROUP_TEMPLATE");
export const PopupMenuIconTemplateToken = new InjectionToken<PopupTemplateConfig>("MONA_POPUP_MENU_ICON_TEMPLATE");
export const PopupMenuShortcutTemplateToken = new InjectionToken<PopupTemplateConfig>(
    "MONA_POPUP_MENU_SHORTCUT_TEMPLATE"
);
export const PopupMenuTextTemplateToken = new InjectionToken<PopupTemplateConfig>("MONA_POPUP_MENU_TEXT_TEMPLATE");
/* eslint-enable @typescript-eslint/naming-convention */

export interface PopupMenuConfig {
    getPopupMenuItem: () => PopupMenuItem[];
    readonly origin: PopupMenuOrigin;
    readonly type: PopupMenuItemType;
}

export interface PopupTemplateConfig {
    readonly origin: PopupMenuTemplateOrigin;
    readonly template: TemplateRef<unknown>;
    readonly type: PopupMenuTemplateType;
}

export enum PopupMenuOrigin {
    Popup = 1,
    ContextMenu,
    DropdownButton,
    SplitButton,
    MenubarMenu
}

export enum PopupMenuItemType {
    CheckboxMenuItem = 1,
    MenuItem,
    MenuGroup,
    RadioGroup,
    RadioItem,
    Separator
}

export enum PopupMenuTemplateOrigin {
    Popup = 1,
    ContextMenu,
    DropdownButton,
    SplitButton,
    MenubarMenu
}

export enum PopupMenuTemplateType {
    Group = 1,
    Icon,
    Shortcut,
    Text
}
