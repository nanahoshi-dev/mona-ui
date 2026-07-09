import { Position } from "@nanahoshi/mona-ui/common";

export interface ToolbarOptions {
    actions: ToolbarAction[];
    position: Position;
}

export type ToolbarAction =
    "clear" | "moveDown" | "moveUp" | "remove" | "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo";
