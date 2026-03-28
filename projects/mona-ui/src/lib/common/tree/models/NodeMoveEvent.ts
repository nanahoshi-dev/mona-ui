import { TreeViewComponent } from "../../../tree-view/components/tree-view/tree-view.component";
import { DropPosition } from "./DropPositionChangeEvent";
import { NodeItem } from "./NodeItem";

export interface NodeMoveEvent<T> {
    readonly position: DropPosition;
    readonly sourceItem: NodeItem<T>;
    readonly sourceTree: TreeViewComponent<T>;
    readonly targetItem: NodeItem<T>;
    readonly targetTree: TreeViewComponent<T>;
}

export type NodeMoveEventSansTree<T> = Omit<NodeMoveEvent<T>, "sourceTree" | "targetTree">;
