import { from, ImmutableSet, select, toImmutableSet } from "@mirei/ts-collections";
import { MenuItemGroupComponent } from "../menu-item-group/menu-item-group.component";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { MenuItem, MenuItemOptions } from "../models/MenuItem";

/**
 * Converts an iterable of MenuItemOptions to properly structured menu item sets
 */
export const convertToMenuItemSet = (optionsList: Iterable<MenuItemOptions>): ImmutableSet<ImmutableSet<MenuItem>> => {
    return ImmutableSet.create(
        from(optionsList)
            .select(options => {
                const subMenuItemsSet = createSubMenuItemsSet(options.subMenuItems);
                const menuItem = createMenuItems(options, subMenuItemsSet);
                return select([menuItem], item => item).toImmutableSet();
            })
            .toImmutableSet()
    );
};

export const createMenuItems = (
    options: MenuItemOptions,
    subMenuItemsSet: ImmutableSet<ImmutableSet<MenuItem>> = ImmutableSet.create()
): MenuItem => ({
    data: options.data,
    disabled: options.disabled ?? false,
    divider: options.divider ?? false,
    group: options.group,
    options,
    subMenuItemsSet,
    text: options.text
});

/**
 * Creates nested sub-menu items from MenuItemOptions
 */
export const createSubMenuItemsSet = (
    subMenuItems?: Iterable<MenuItemOptions[]>
): ImmutableSet<ImmutableSet<MenuItem>> => {
    if (!subMenuItems) {
        return ImmutableSet.create();
    }

    return select(subMenuItems, (items: MenuItemOptions[]) => {
        return ImmutableSet.create(
            items.map(itemOptions => {
                const nestedSubMenus = createSubMenuItemsSet(itemOptions.subMenuItems);
                return createMenuItems(itemOptions, nestedSubMenus);
            })
        );
    }).toImmutableSet();
};

export const hasSubMenuItems = (menuItem: MenuItem): boolean => menuItem.subMenuItemsSet.length > 0;
export const isInteractive = (menuItem: MenuItem): boolean => !menuItem.disabled && !menuItem.divider;

/**
 * Prepares menu items from component children, organizing them into groups
 */
export const prepareMenuItems = (
    items: Iterable<MenuItemComponent | MenuItemGroupComponent>
): ImmutableSet<ImmutableSet<MenuItem>> => {
    return select(items, item => {
        if (item instanceof MenuItemGroupComponent) {
            return select(item.menuItems(), subItem => {
                const menuItem = subItem.getMenuItem();
                // Create a new menu item with the group assigned
                return {
                    ...menuItem,
                    group: item.title()
                };
            }).toImmutableSet();
        } else {
            return toImmutableSet([item.getMenuItem()]);
        }
    }).toImmutableSet();
};
