import type { Signal, TemplateRef } from "@angular/core";
import type { Subject } from "rxjs";
import type { PopupMenuItemClickEvent } from "./PopupMenuItemClickEvent";

export interface PopupMenuItem {
    /** Whether the item is a checkbox item. */
    checkable?: boolean;
    /** The checked state of a checkbox item. */
    checked?: Signal<boolean>;
    /**
     * The stream the menu pushes the item's click events to. The item component or radio group behind the item
     * listens to it.
     */
    click$?: Subject<PopupMenuItemClickEvent>;
    /** Whether the item can't be activated. */
    disabled: boolean;
    /**
     * The group the item belongs to. Consecutive items with the same key form a group. A string key, or a symbol
     * with a description, is the group's title.
     */
    group: string | symbol;
    /** The template that renders the title of the item's group, or `null` to use the menu's group template. */
    groupTemplate: Signal<TemplateRef<unknown> | null> | null;
    /** The template that renders the item's icon, or `null` to use the menu's icon template. */
    iconTemplate: Signal<TemplateRef<unknown> | null> | null;
    /** The items of the item's submenu. Empty when it has none. */
    items: PopupMenuItem[];
    /** The item's text. */
    label: string;
    /** Whether the item is a radio item in a radio group. */
    radio?: boolean;
    /** Whether a radio item is the selected item of its radio group. */
    selected?: Signal<boolean>;
    /** Whether the item is a divider. */
    separator?: boolean;
    /** The template that renders the item's shortcut text, or `null` to use the menu's shortcut template. */
    shortcutTemplate: Signal<TemplateRef<unknown> | null> | null;
    /** The template that renders the item's text in place of its label, or `null` to use the menu's text template. */
    textTemplate: Signal<TemplateRef<unknown> | null> | null;
    /** A unique id for the item. The menu uses it as the item element's `id`. */
    uid: string;
    /** The item's value: the `value` input of the item component, or the `value` of a `MenuItem`. */
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
