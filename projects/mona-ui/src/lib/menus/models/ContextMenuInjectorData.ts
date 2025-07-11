import { OutputEmitterRef, Signal, WritableSignal } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { Subject } from "rxjs";
import { PopupRef } from "../../popup/models/PopupRef";
import { ContextMenuNavigationEvent } from "./ContextMenuNavigationEvent";
import { MenuItem } from "./MenuItem";
import { InternalMenuItemClickEvent } from "./MenuItemClickEvent";

export interface ContextMenuInjectorData<C = any> {
    context?: C;
    isRoot?: boolean;
    menuClick?: Subject<InternalMenuItemClickEvent<C>>;
    menuItems: WritableSignal<ImmutableSet<ImmutableSet<MenuItem>>>;
    navigate?: OutputEmitterRef<ContextMenuNavigationEvent>;
    parentMenuRef?: PopupRef;
    popupClass?: string | string[];
    subMenuClose?: Subject<void>;
    userClasses: Signal<string>;
    userStyles: Signal<string>;
    viaKeyboard?: boolean;
}
