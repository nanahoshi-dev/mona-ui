import { TemplateRef } from "@angular/core";
import { ImmutableSet, select } from "@mirei/ts-collections";
import { ContextMenuItemIconTemplateContext } from "./ContextMenuItemIconTemplateContext";
import { ContextMenuItemTextTemplateContext } from "./ContextMenuItemTextTemplateContext";
import { InternalMenuItemClickEvent } from "./MenuItemClickEvent";

export interface MenuItemOptions {
    data?: unknown;
    disabled?: boolean;
    divider?: boolean;
    group?: string;
    subMenuItems?: Iterable<MenuItemOptions[]>;
    text?: string;
}

export class MenuItem {
    public data?: unknown;
    public depth?: number;
    public disabled?: boolean;
    public divider?: boolean;
    public group?: string;
    public iconClass?: string;
    public iconTemplate?: TemplateRef<ContextMenuItemIconTemplateContext>;
    public menuClick?: (event: InternalMenuItemClickEvent<any>) => void;
    public parent?: MenuItem | null;
    public shortcutTemplate?: TemplateRef<unknown>;
    public subMenuItemsSet: ImmutableSet<ImmutableSet<MenuItem>>;
    public text?: string;
    public textTemplate?: TemplateRef<ContextMenuItemTextTemplateContext>;

    public constructor(public readonly options: MenuItemOptions) {
        this.data = options.data;
        this.disabled = options.disabled;
        this.divider = options.divider;
        this.group = options.group;
        this.subMenuItemsSet = this.prepareSubMenuItems(options.subMenuItems ?? []);
        this.text = options.text;
    }

    private prepareSubMenuItems(submenuItems: Iterable<MenuItemOptions[]>): ImmutableSet<ImmutableSet<MenuItem>> {
        return select(submenuItems, items => {
            return ImmutableSet.create(items.map(item => new MenuItem(item)));
        }).toImmutableSet();
    }
}
