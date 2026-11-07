import type { Signal, TemplateRef } from "@angular/core";
import type { Subject } from "rxjs";
import type { PopupMenuItemClickEvent } from "./PopupMenuItemClickEvent";

export interface PopupMenuItem {
    checkable?: boolean;
    checked?: Signal<boolean>;
    click$?: Subject<PopupMenuItemClickEvent>;
    disabled: boolean;
    /**
     * The group the item belongs to. Consecutive items with the same key form a group. A string key, or a symbol
     * with a description, is the group's title.
     */
    group: string | symbol;
    groupTemplate: Signal<TemplateRef<unknown> | null> | null;
    iconTemplate: Signal<TemplateRef<unknown> | null> | null;
    items: PopupMenuItem[];
    label: string;
    radio?: boolean;
    selected?: Signal<boolean>;
    separator?: boolean;
    shortcutTemplate: Signal<TemplateRef<unknown> | null> | null;
    textTemplate: Signal<TemplateRef<unknown> | null> | null;
    uid: string;
    value?: Signal<unknown>;
}

export interface MenuItem {
    /**
     * Whether the item is a checkbox item. Its `checked` state toggles when it's activated, unless `menuClick` is
     * prevented. The state lives in the menu: read the new state from the event's `checked` and keep it in your
     * items if they can be replaced.
     */
    checkable?: boolean;
    /** The item's initial checked state. */
    checked?: boolean;
    /** Keeps the item from being activated. */
    disabled?: boolean;
    /**
     * The title of the group the item belongs to. Consecutive items with the same group form one group.
     */
    group?: string;
    /** The items of its submenu. */
    items?: MenuItem[];
    /** Required. The item's text. */
    label: string;
    /** Renders the item as a divider. */
    separator?: boolean;
    /**
     * A value that identifies the item in `menuClick` (the event's `value`).
     */
    value?: unknown;
}
