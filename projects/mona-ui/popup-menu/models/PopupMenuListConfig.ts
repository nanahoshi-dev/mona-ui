import { Signal, TemplateRef } from "@angular/core";
import { IGroup } from "@mirei/ts-collections";
import { Subject } from "rxjs";
import { PopupMenuVariantProps } from "../styles/popup-menu.styles";
import { PopupMenuItem } from "./PopupMenuItem";
import { PopupMenuItemClickEvent } from "./PopupMenuItemClickEvent";
import { PopupMenuNavigationEvent } from "./PopupMenuNavigationEvent";

export interface PopupMenuListConfig {
    childCloseRequest$?: Subject<void>;
    items: Iterable<IGroup<string | symbol, PopupMenuItem>>;
    isRoot: boolean;
    menuId: string;
    menuItemClick$: Subject<PopupMenuItemClickEvent>;
    minWidth: Signal<string | null> | null;
    navigate$: Subject<PopupMenuNavigationEvent>;
    level: number;
    parentClose$: Subject<void>;
    popupGroupTemplate: Signal<TemplateRef<any> | null> | null;
    popupIconTemplate: Signal<TemplateRef<any> | null> | null;
    popupShortcutTemplate: Signal<TemplateRef<any> | null> | null;
    popupTextTemplate: Signal<TemplateRef<any> | null> | null;
    rounded: Signal<PopupMenuVariantProps["rounded"]>;
    size: Signal<PopupMenuVariantProps["size"]>;
    viaKeyboardNavigation?: boolean;
    width: Signal<string | null> | null;
}
