import { PopupMenuItem } from "./PopupMenuItem";

export interface PopupMenuNavigationEvent {
    direction: "up" | "down" | "left" | "right";
    item: PopupMenuItem | null;
    level: number;
}
