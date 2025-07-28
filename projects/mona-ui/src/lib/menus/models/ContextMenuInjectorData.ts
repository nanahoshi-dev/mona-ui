import { OutputEmitterRef, Signal, TemplateRef, WritableSignal } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { Subject } from "rxjs";
import { PopupRef } from "../../popup/models/PopupRef";
import { ContextMenuContentVariantProps } from "../styles/menu.styles";
import { ContextMenuNavigationEvent } from "./ContextMenuNavigationEvent";
import { MenuGroupTemplateContext } from "./MenuGroupTemplateContext";
import { MenuItem } from "./MenuItem";
import { InternalMenuItemClickEvent } from "./MenuItemClickEvent";
import { MenuItemTemplateContext } from "./MenuItemTemplateContext";

export interface ContextMenuInjectorData<C = any> {
    context?: C;
    groupTemplate?: TemplateRef<MenuGroupTemplateContext>;
    iconTemplate?: TemplateRef<MenuItemTemplateContext>;
    isRoot?: boolean;
    menuClick?: Subject<InternalMenuItemClickEvent<C>>;
    menuItems: WritableSignal<ImmutableSet<ImmutableSet<MenuItem>>>;
    navigate?: OutputEmitterRef<ContextMenuNavigationEvent>;
    parentMenuRef?: PopupRef;
    popupClass?: string | string[];
    rounded: ContextMenuContentVariantProps["rounded"];
    shortcutTemplate?: TemplateRef<MenuItemTemplateContext>;
    size: ContextMenuContentVariantProps["size"];
    subMenuClose?: Subject<void>;
    textTemplate?: TemplateRef<MenuItemTemplateContext>;
    userClasses: Signal<string>;
    userStyles: Signal<string>;
    viaKeyboard?: boolean;
}
