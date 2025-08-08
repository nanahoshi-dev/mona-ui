import { TemplateRef } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { MenuGroupTemplateContext } from "./MenuGroupTemplateContext";
import { InternalMenuItemClickEvent } from "./MenuItemClickEvent";
import { MenuItemTemplateContext } from "./MenuItemTemplateContext";

/**
 * Configuration options for creating a menu item
 */
export interface MenuItemOptions {
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
     * Nesting depth in the menu hierarchy
     */
    depth?: number;

    /**
     * Whether the menu item is disabled
     */
    disabled: boolean;

    /**
     * Whether this item should render as a divider
     */
    divider: boolean;

    /**
     * Group name for organizing menu items
     */
    group?: string;

    /**
     * Template for the custom group title
     */
    groupTemplate?: TemplateRef<MenuGroupTemplateContext>;

    /**
     * Template for custom icon rendering
     */
    iconTemplate?: TemplateRef<MenuItemTemplateContext>;

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
    shortcutTemplate?: TemplateRef<MenuItemTemplateContext>;

    /**
     * Nested submenu items organized in groups
     */
    subMenuItemsSet: ImmutableSet<ImmutableSet<MenuItem>>;

    /**
     * Display text for the menu item
     */
    text?: string;

    /**
     * Template for custom text rendering
     */
    textTemplate?: TemplateRef<MenuItemTemplateContext>;
}
