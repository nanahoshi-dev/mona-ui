export interface InternalMenuItemClickEvent<C> {
    context?: C;
    originalEvent: MouseEvent | KeyboardEvent;
}

export interface MenuItemClickEvent<C, T> extends InternalMenuItemClickEvent<C> {
    data?: T;
}
