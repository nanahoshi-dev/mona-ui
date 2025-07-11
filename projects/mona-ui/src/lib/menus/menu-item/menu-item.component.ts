import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    effect,
    forwardRef,
    input,
    output,
    Signal,
    TemplateRef,
    untracked
} from "@angular/core";
import { select } from "@mirei/ts-collections";
import { MenuItemShortcutTemplateDirective } from "../directives/menu-item-shortcut-template.directive";
import { MenuItemGroupComponent } from "../menu-item-group/menu-item-group.component";
import { InternalMenuItemClickEvent, MenuItemClickEvent } from "../models/MenuItemClickEvent";
import { MenuItemInjectionToken } from "../models/MenuItemInjectionToken";
import { prepareMenuItems } from "../utils/prepareMenuItems";
import { MenuItemIconTemplateDirective } from "../directives/menu-item-icon-template.directive";
import { MenuItemTextTemplateDirective } from "../directives/menu-item-text-template.directive";
import { MenuItem } from "../models/MenuItem";

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
export class MenuItemComponent<T = unknown> {
    readonly #menuItem: Signal<MenuItem> = computed(() => {
        return new MenuItem({
            data: this.data(),
            disabled: this.disabled(),
            divider: this.divider(),
            subMenuItems: [],
            text: this.text()
        });
    });
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
     * @description The data associated with the menu item.
     * This can be any type of data that you want to associate with the menu item.
     */
    public readonly data = input<T>();

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
     * @description The icon class to use for the menu item.
     */
    public readonly iconClass = input<string>("");

    /**
     * @description Emits when the menu item is clicked.
     */
    public readonly menuClick = output<MenuItemClickEvent<any, T>>();

    /**
     * @description The text to display for the menu item.
     */
    public readonly text = input<string>("");

    public constructor() {
        effect(() => {
            const submenuItems = this.submenuItems();
            untracked(() => {
                this.#menuItem().subMenuItemsSet = prepareMenuItems(submenuItems);
            });
        });
    }

    public getMenuItem(): MenuItem {
        return this.getMenuItemWithDepth(0);
    }

    private getMenuItemWithDepth(depth: number = 0): MenuItem {
        this.#menuItem().iconClass = this.iconClass();
        this.#menuItem().iconTemplate = this.iconTemplate();
        this.#menuItem().shortcutTemplate = this.shortcutTemplate();
        this.#menuItem().menuClick = (event: InternalMenuItemClickEvent<any>): void => {
            const clickEvent: MenuItemClickEvent<any, T> = this.data() ? { ...event, data: this.data() } : event;
            this.menuClick.emit(clickEvent);
        };
        const items = select(this.submenuItems(), si => (si instanceof MenuItemGroupComponent ? si.menuItems() : [si]));
        this.#menuItem().subMenuItemsSet = items
            .select(i => {
                return select(i, mi => {
                    const subMenuItem = mi.getMenuItemWithDepth(depth + 1);
                    subMenuItem.parent = this.#menuItem();
                    return subMenuItem;
                }).toImmutableSet();
            })
            .toImmutableSet();

        this.#menuItem().depth = depth;
        this.#menuItem().textTemplate = this.textTemplate();
        return this.#menuItem();
    }
}
