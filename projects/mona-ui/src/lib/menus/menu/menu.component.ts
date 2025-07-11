import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    input,
    TemplateRef
} from "@angular/core";
import { any, select, selectMany } from "@mirei/ts-collections";
import { MenuItemGroupComponent } from "../menu-item-group/menu-item-group.component";
import { MenuItemInjectionToken } from "../models/MenuItemInjectionToken";
import { prepareMenuItems } from "../utils/prepareMenuItems";
import { v4 } from "uuid";
import { ContextMenuComponent } from "../context-menu/context-menu.component";
import { MenuTextTemplateDirective } from "../directives/menu-text-template.directive";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { MenuItem, MenuItemOptions } from "../models/MenuItem";

@Component({
    selector: "mona-menu",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent {
    protected readonly menuItemComponents = contentChildren<MenuItemComponent | MenuItemGroupComponent>(
        MenuItemInjectionToken
    );
    public readonly disabled = input(false);
    public readonly items = input<Iterable<MenuItemOptions>>([]);
    public readonly textTemplate = contentChild(MenuTextTemplateDirective, { read: TemplateRef });
    public readonly uid = v4();
    public readonly menuItems = computed(() => {
        const menuItemComponents = this.menuItemComponents();
        const items = this.items();
        if (any(items)) {
            return selectMany(
                select(items, item => select([item], i => new MenuItem(i))),
                i => i
            ).toImmutableSet();
        }
        return selectMany(prepareMenuItems(menuItemComponents), i => i).toImmutableSet();
    });
    public readonly text = input("");
    public contextMenu: ContextMenuComponent | null = null;
}
