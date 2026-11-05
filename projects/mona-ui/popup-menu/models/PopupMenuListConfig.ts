import { Signal, TemplateRef } from "@angular/core";
import { Subject } from "rxjs";
import { PopupMenuVariantProps } from "../styles/popup-menu.styles";
import type { PopupMenuItemGroup } from "./PopupMenuItemGroup";
import { PopupMenuItemClickEvent } from "./PopupMenuItemClickEvent";
import { PopupMenuNavigationEvent } from "./PopupMenuNavigationEvent";

export interface PopupMenuListConfig {
    childCloseRequest$?: Subject<void>;
    isRoot: boolean;
    items: readonly PopupMenuItemGroup[];
    level: number;
    menuId: string;
    menuItemClick$: Subject<PopupMenuItemClickEvent>;
    minWidth: Signal<string | null> | null;
    navigate$: Subject<PopupMenuNavigationEvent>;
    parentClose$: Subject<void>;
    popupGroupTemplate: Signal<TemplateRef<unknown> | null> | null;
    popupIconTemplate: Signal<TemplateRef<unknown> | null> | null;
    popupShortcutTemplate: Signal<TemplateRef<unknown> | null> | null;
    popupTextTemplate: Signal<TemplateRef<unknown> | null> | null;
    rounded: Signal<PopupMenuVariantProps["rounded"]>;
    size: Signal<PopupMenuVariantProps["size"]>;
    viaKeyboardNavigation?: boolean;
    width: Signal<string | null> | null;
}
