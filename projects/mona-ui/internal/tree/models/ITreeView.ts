import type { DropPosition } from "./DropPositionChangeEvent";
import type { NodeItem } from "./NodeItem";
import type { NodeMoveSnapshot } from "./NodeMoveSnapshot";

export interface ITreeView<T> {
    moveNode(source: NodeItem<T>, target: NodeItem<T>, position: DropPosition): NodeMoveSnapshot | null;
    undoMoveNode(snapshot: NodeMoveSnapshot): void;
}
