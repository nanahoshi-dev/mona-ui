import { from, ImmutableSet, select, toImmutableSet } from "@mirei/ts-collections";
import { MenuItemGroupComponent } from "../menu-item-group/menu-item-group.component";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { MenuItem, MenuItemOptions } from "../models/MenuItem";

export const prepareMenuItems = (items: Iterable<MenuItemComponent | MenuItemGroupComponent>) => {
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
