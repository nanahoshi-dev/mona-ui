import { TreeViewComponent } from "../../../tree-view/components/tree-view/tree-view.component";

export interface NodeMoveSnapshot<T> {
    readonly originalIndex: number;
    readonly originalParentUid: string | null;
    readonly sourceNodeUid: string;
    readonly sourceTree: TreeViewComponent<T>;
    readonly targetTree: TreeViewComponent<T>;
}
