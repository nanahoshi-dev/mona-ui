import { concat, from, ImmutableSet, select, toImmutableSet } from "@mirei/ts-collections";
import { MenuItemComponent, MenuItemGroupComponent, MenuItemOptions } from "mona-ui";
import { MenuItem } from "mona-ui/menus/models/MenuItem";

export const prepareSubMenuItems = (items: Iterable<MenuItemComponent | MenuItemGroupComponent>) => {
    return select(items, item => {
        return item instanceof MenuItemGroupComponent
            ? select(item.menuItems(), subItem => {
                  const menuItem = subItem.getMenuItem();
                  menuItem.group = item.title();
                  return menuItem;
              }).toImmutableSet()
            : toImmutableSet([item.getMenuItem()]);
    }).toImmutableSet();
};

export const convertToMenuItemSet = (optionsList: Iterable<MenuItemOptions>): ImmutableSet<ImmutableSet<MenuItem>> => {
    return ImmutableSet.create(
        from(optionsList)
            .select(mi => select([mi], m => new MenuItem(m)).toImmutableSet())
            .toImmutableSet()
    );
};
