import { MenuItemOptions } from "./MenuItem";

export interface MenuTextTemplateContext {
    $implicit: string;
    items: MenuItemOptions[];
}
