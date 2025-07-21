import { TemplateRef } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { ContextMenuItemIconTemplateContext } from "./ContextMenuItemIconTemplateContext";
import { ContextMenuItemTextTemplateContext } from "./ContextMenuItemTextTemplateContext";
import { InternalMenuItemClickEvent } from "./MenuItemClickEvent";

/**
 * Configuration options for creating a menu item
 */
export interface MenuItemOptions {
    /**
     * Additional data associated with the menu item
     */
    data?: unknown;

    /**
     * Whether the menu item is disabled
     */
    disabled?: boolean;

    /**
     * Whether this item should render as a divider
     */
    divider?: boolean;

    /**
     * Group name for organizing menu items
     */
    group?: string;

    /**
     * Nested submenu items
     */
    subMenuItems?: Iterable<MenuItemOptions[]>;

    /**
     * Display text for the menu item
     */
    text?: string;
}

/**
 * Represents a single menu item in a context menu
 */
export interface MenuItem {
    /**
     * Additional data associated with the menu item
     */
    readonly data?: unknown;

    /**
     * Nesting depth in the menu hierarchy
     */
    depth?: number;

    /**
     * Whether the menu item is disabled
     */
    readonly disabled: boolean;

    /**
     * Whether this item should render as a divider
     */
    readonly divider: boolean;

    /**
     * Group name for organizing menu items
     */
    group?: string;

    /**
     * CSS class for the menu item icon
     */
    iconClass?: string;

    /**
     * Template for custom icon rendering
     */
    iconTemplate?: TemplateRef<ContextMenuItemIconTemplateContext>;

    /**
     * Click handler for the menu item
     * @param event
     */
    menuClick?: (event: InternalMenuItemClickEvent<unknown>) => void;

    /**
     * Reference to the original options used to create this menu item
     */
    readonly options: MenuItemOptions;

    /**
     * Parent menu item (for nested menus)
     */
    parent?: MenuItem | null;

    /**
     * Template for keyboard shortcut display
     */
    shortcutTemplate?: TemplateRef<unknown>;

    /**
     * Nested sub-menu items organized in groups
     */
    readonly subMenuItemsSet: ImmutableSet<ImmutableSet<MenuItem>>;

    /**
     * Display text for the menu item
     */
    readonly text?: string;

    /**
     * Template for custom text rendering
     */
    textTemplate?: TemplateRef<ContextMenuItemTextTemplateContext>;
}
