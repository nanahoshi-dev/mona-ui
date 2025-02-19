import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    effect,
    input,
    output,
    Signal,
    TemplateRef,
    untracked
} from "@angular/core";
import { MenuItemShortcutTemplateDirective } from "mona-ui/menus/directives/menu-item-shortcut-template.directive";
import { MenuItemIconTemplateDirective } from "../directives/menu-item-icon-template.directive";
import { MenuItemTextTemplateDirective } from "../directives/menu-item-text-template.directive";
import { InternalMenuItemClickEvent, MenuItemClickEvent } from "../models/ContextMenuInjectorData";
import { MenuItem } from "../models/MenuItem";

@Component({
    selector: "mona-menu-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItemComponent<T = unknown> {
    readonly #menuItem: Signal<MenuItem> = computed(() => {
        return {
            data: this.data(),
            disabled: this.disabled(),
            divider: this.divider(),
            iconClass: this.iconClass(),
            parent: null,
            subMenuItems: [],
            text: this.text(),
            visible: this.visible()
        };
    });

    protected readonly iconTemplate = contentChild(MenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly shortcutTemplate = contentChild(MenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly submenuItems = contentChildren(MenuItemComponent);
    protected readonly textTemplate = contentChild(MenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    public readonly menuClick = output<MenuItemClickEvent<any, T>>();

    public data = input<T>();
    public disabled = input<boolean>(false);
    public divider = input<boolean>(false);
    public iconClass = input<string>("");
    public text = input<string>("");
    public visible = input<boolean>(true);

    public constructor() {
        effect(() => {
            const submenuItems = this.submenuItems();
            untracked(() => {
                this.#menuItem().subMenuItems = submenuItems.map(si => si.getMenuItem());
            });
        });
    }

    public getMenuItem(): MenuItem {
        return this.getMenuItemWithDepth(0);
    }

    private getMenuItemWithDepth(depth: number = 0): MenuItem {
        this.#menuItem().iconTemplate = this.iconTemplate();
        this.#menuItem().shortcutTemplate = this.shortcutTemplate();
        this.#menuItem().menuClick = (event: InternalMenuItemClickEvent<any>): void => {
            const clickEvent: MenuItemClickEvent<any, T> = this.data() ? { ...event, data: this.data() } : event;
            this.menuClick.emit(clickEvent);
        };
        this.#menuItem().subMenuItems = this.submenuItems().map(si => {
            const subMenuItem = si.getMenuItemWithDepth(depth + 1);
            subMenuItem.parent = this.#menuItem();
            return subMenuItem;
        });
        this.#menuItem().depth = depth;
        this.#menuItem().textTemplate = this.textTemplate();
        return this.#menuItem();
    }
}
