import type { DropPosition } from "./DropPositionChangeEvent";
import type { TreeNode } from "./TreeNode";

/** The ways Ctrl+Shift+Arrow moves a node: past a sibling, into the previous sibling, or out of its parent. */
export type TreeKeyboardMoveDirection = "down" | "in" | "out" | "up";

/** Where a keyboard move takes a node. */
export interface TreeKeyboardMove<T> {
    readonly position: Exclude<DropPosition, "outside">;
    readonly targetNode: TreeNode<T>;
}
