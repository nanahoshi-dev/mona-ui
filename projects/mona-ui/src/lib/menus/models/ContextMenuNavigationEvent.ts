import { MenuItemOptions } from "./MenuItem";

export interface ContextMenuNavigationEvent {
    currentItem: MenuItemOptions | null;
    direction: "down" | "up" | "left" | "right";
    previousItem: MenuItemOptions | null;
}
