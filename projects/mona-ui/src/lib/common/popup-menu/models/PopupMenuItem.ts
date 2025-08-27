import { Signal, TemplateRef } from "@angular/core";
import { Subject } from "rxjs";
import { PopupMenuItemClickEvent } from "./PopupMenuItemClickEvent";

export interface PopupMenuItem {
    checkable?: boolean;
    checked?: Signal<boolean>;
    click$?: Subject<PopupMenuItemClickEvent>;
    disabled: boolean;
    group: string | symbol;
    groupTemplate: Signal<TemplateRef<any> | null> | null;
    iconTemplate: Signal<TemplateRef<any> | null> | null;
    items: PopupMenuItem[];
    label: string;
    radio?: boolean;
    selected?: Signal<boolean>;
    separator?: boolean;
    shortcutTemplate: Signal<TemplateRef<any> | null> | null;
    textTemplate: Signal<TemplateRef<any> | null> | null;
    uid: string;
    value?: Signal<string>;
}

export interface MenuItem {
    checkable?: boolean;
    checked?: boolean;
    disabled?: boolean;
    group?: string;
    items?: MenuItem[];
    label: string;
    separator?: boolean;
}
