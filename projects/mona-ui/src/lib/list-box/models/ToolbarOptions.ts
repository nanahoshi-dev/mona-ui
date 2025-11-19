import { Position } from "../../models/Position";

export interface ToolbarOptions {
    actions: ToolbarAction[];
    position: Position;
}

export type ToolbarAction =
    | "clear"
    | "moveDown"
    | "moveUp"
    | "remove"
    | "transferAllFrom"
    | "transferAllTo"
    | "transferFrom"
    | "transferTo";
