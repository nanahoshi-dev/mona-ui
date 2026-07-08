import { DropPosition } from "./DropPositionChangeEvent";
import { NodeItem } from "./NodeItem";
import { NodeMoveSnapshot } from "./NodeMoveSnapshot";

export interface ITreeView<T> {
    moveNode(source: NodeItem<T>, target: NodeItem<T>, position: DropPosition): NodeMoveSnapshot | null;
    undoMoveNode(snapshot: NodeMoveSnapshot): void;
}
