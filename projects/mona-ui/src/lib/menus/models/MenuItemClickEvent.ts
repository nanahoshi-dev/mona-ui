import { MenuItemOptions } from "./MenuItem";

export interface InternalMenuItemClickEvent<C> {
    context?: C;
    menuItem: MenuItemOptions;
    originalEvent: MouseEvent | KeyboardEvent;
}

export class MenuItemClickEvent<C = any> {
    public readonly context?: C;
    public readonly menuItem: MenuItemOptions;
    public readonly originalEvent: MouseEvent | KeyboardEvent;

    public constructor(options: InternalMenuItemClickEvent<C>) {
        this.context = options.context;
        this.menuItem = options.menuItem;
        this.originalEvent = options.originalEvent;
    }
}
