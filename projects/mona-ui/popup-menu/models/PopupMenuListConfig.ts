import type { Signal, TemplateRef } from "@angular/core";
import type { Subject } from "rxjs";
import type { PopupMenuVariantProps } from "../styles/popup-menu.styles";
import type { PopupMenuItemClickEvent } from "./PopupMenuItemClickEvent";
import type { PopupMenuItemGroup } from "./PopupMenuItemGroup";
import type { PopupMenuNavigationEvent } from "./PopupMenuNavigationEvent";

/** The item a menu opened from the keyboard highlights first. */
export type PopupMenuInitialFocus = "first" | "last";

/** How a menu list asks the root menu to close the whole chain. */
export interface PopupMenuCloseRequest {
    /** Focus moved to this element, outside every menu of the chain. */
    readonly focusLeftTo?: Element;
    /** Tab was pressed: focus goes back to the trigger before the browser moves it on. */
    readonly tab?: boolean;
}

export interface PopupMenuListConfig {
    /** The root menu's name; submenus are named by their parent item. */
    ariaLabel?: string;
    childCloseRequest$?: Subject<void>;
    closeMenu: (request: PopupMenuCloseRequest) => void;
    initialFocus?: PopupMenuInitialFocus | null;
    isRoot: boolean;
    items: Signal<readonly PopupMenuItemGroup[]>;
    labelledBy: string | null;
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
    /** Called when the pointer enters this submenu, so its parent keeps it open. */
    submenuPointerEnter?: () => void;
    viaKeyboardNavigation?: boolean;
    width: Signal<string | null> | null;
}
