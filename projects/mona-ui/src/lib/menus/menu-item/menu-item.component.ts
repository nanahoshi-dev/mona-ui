import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    forwardRef,
    input,
    output,
    TemplateRef
} from "@angular/core";
import { ImmutableSet, select } from "@mirei/ts-collections";
import { MenuItemIconTemplateDirective } from "../directives/menu-item-icon-template.directive";
import { MenuItemShortcutTemplateDirective } from "../directives/menu-item-shortcut-template.directive";
import { MenuItemTextTemplateDirective } from "../directives/menu-item-text-template.directive";
import { MenuItemGroupComponent } from "../menu-item-group/menu-item-group.component";
import { MenuItem } from "../models/MenuItem";
import { InternalMenuItemClickEvent, MenuItemClickEvent } from "../models/MenuItemClickEvent";
import { MenuItemInjectionToken } from "../models/MenuItemInjectionToken";
import { createMenuItems } from "../utils/menu.utils";

@Component({
    selector: "mona-menu-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: MenuItemInjectionToken,
            useExisting: forwardRef(() => MenuItemComponent)
        }
    ]
})
export class MenuItemComponent {
    readonly #baseMenuItemOptions = computed(() => ({
        disabled: this.disabled(),
        divider: this.divider(),
        subMenuItems: [],
        text: this.text()
    }));
    protected readonly iconTemplate = contentChild(MenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly shortcutTemplate = contentChild(MenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly submenuItems = contentChildren<MenuItemComponent | MenuItemGroupComponent>(
        MenuItemInjectionToken,
        { descendants: false }
    );
    protected readonly textTemplate = contentChild(MenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });

    /**
     * @description Sets the menu item as disabled.
     */
    public readonly disabled = input<boolean>(false);

    /**
     * @description Sets the menu item as a divider.
     * A divider is a horizontal line that separates menu items.
     */
    public readonly divider = input<boolean>(false);

    /**
     * @description Emits when the menu item is clicked.
     */
    public readonly menuClick = output<MenuItemClickEvent>();

    /**
     * @description The text to display for the menu item.
     */
    public readonly text = input<string>("");

    public getMenuItem(): MenuItem {
        return this.getMenuItemWithDepth(0);
    }

    private createSubMenuItemsSet(depth: number): ImmutableSet<ImmutableSet<MenuItem>> {
        return select(this.submenuItems(), item => {
            if (item instanceof MenuItemGroupComponent) {
                return select(item.menuItems(), subItem => {
                    const menuItem = subItem.getMenuItemWithDepth(depth + 1);
                    const groupedMenuItem: MenuItem = {
                        ...menuItem,
                        parent: menuItem.parent ?? null,
                        group: item.title(),
                        groupTemplate: item.titleTemplate()
                    };
                    return groupedMenuItem;
                }).toImmutableSet();
            }
            const menuItem = item.getMenuItemWithDepth(depth + 1);
            return select([menuItem], i => i).toImmutableSet();
        }).toImmutableSet();
    }

    private getMenuItemWithDepth(depth: number = 0): MenuItem {
        const submenuItemsSet = this.createSubMenuItemsSet(depth);
        const baseOptions = this.#baseMenuItemOptions();
        const menuItem = createMenuItems(baseOptions, submenuItemsSet);
        return {
            ...menuItem,
            depth,
            iconTemplate: this.iconTemplate(),
            shortcutTemplate: this.shortcutTemplate(),
            textTemplate: this.textTemplate(),
            menuClick: (event: InternalMenuItemClickEvent<any>): void => {
                const clickEvent = new MenuItemClickEvent(event);
                this.menuClick.emit(clickEvent);
            }
        };
    }
}
