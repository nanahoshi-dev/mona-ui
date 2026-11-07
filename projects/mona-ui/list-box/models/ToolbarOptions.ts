import type { Position } from "@nanahoshi/mona-ui/common";

export interface ToolbarOptions {
    /** Which toolbar buttons to show. They appear in a fixed order. */
    actions: ToolbarAction[];
    /**
     * Which side of the list the toolbar renders on; `"right"` and `"left"` are the inline end and start, so they swap
     * in RTL.
     */
    position: Position;
}

export type ToolbarAction =
    "clear" | "moveDown" | "moveUp" | "remove" | "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo";
