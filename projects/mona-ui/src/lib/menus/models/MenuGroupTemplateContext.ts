import { MenuItemOptions } from "./MenuItem";

export interface MenuGroupTemplateContext {
    $implicit: string;
    items: MenuItemOptions[];
}
