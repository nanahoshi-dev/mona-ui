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
    subMenuItemsSet: ImmutableSet<ImmutableSet<MenuItem>> = ImmutableSet.create(),
    parent?: MenuItem
): MenuItem => {
    const menuItem: MenuItem = {
        disabled: options.disabled ?? false,
        divider: options.divider ?? false,
        group: options.group,
        options,
        parent: parent ?? null,
        subMenuItemsSet,
        text: options.text
    };

    // Set parent references for all submenu items if any exist
    if (subMenuItemsSet.length > 0) {
        const updatedSubMenuItemsSet = select(subMenuItemsSet, itemGroup => {
            return select(
                itemGroup,
                item =>
                    ({
                        ...item,
                        parent: menuItem
                    }) as MenuItem
            ).toImmutableSet();
        }).toImmutableSet();
        Object.assign(menuItem, { subMenuItemsSet: updatedSubMenuItemsSet });
    }
    return menuItem;
};

/**
 * Creates nested submenu items from MenuItemOptions
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

/**
 * Establishes parent-child relationships for submenu items
 */
export const createSubMenuWithParent = (parentMenuItem: MenuItem): ImmutableSet<ImmutableSet<MenuItem>> => {
    return select(parentMenuItem.subMenuItemsSet, itemGroup => {
        return select(
            itemGroup,
            item =>
                ({
                    ...item,
                    parent: parentMenuItem
                }) as MenuItem
        ).toImmutableSet();
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
            const groupTitleTemplate = item.titleTemplate();
            return select(item.menuItems(), subItem => {
                const menuItem = subItem.getMenuItem();
                return {
                    ...menuItem,
                    group: item.title(),
                    groupTemplate: groupTitleTemplate
                };
            }).toImmutableSet();
        } else {
            return toImmutableSet([item.getMenuItem()]);
        }
    }).toImmutableSet();
};
