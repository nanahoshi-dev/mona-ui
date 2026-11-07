import { type PopupMenuItem } from "@nanahoshi/mona-ui/internal/popup-menu";

export interface PopupMenuNavigationEvent {
    direction: "up" | "down" | "left" | "right";
    item: PopupMenuItem | null;
    level: number;
}
