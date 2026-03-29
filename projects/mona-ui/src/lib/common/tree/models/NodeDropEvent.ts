import { TreeViewComponent } from "../../../tree-view/components/tree-view/tree-view.component";
import { DropPosition } from "./DropPositionChangeEvent";
import { NodeEvent } from "./NodeEvent";
import { NodeItem } from "./NodeItem";
import { TreeNode } from "./TreeNode";

export class NodeDropEvent<T> extends NodeEvent<T> {
    readonly #params: NodeDropEventArgs<T>;
    public constructor(params: NodeDropEventArgs<T>) {
        super("nodeDrop", params.sourceNode, params.event);
        this.#params = params;
    }

    public get position(): DropPosition {
        return this.#params.position;
    }

    public get sourceNode(): NodeItem<T> {
        return this.#params.sourceNode.nodeItem;
    }

    public get sourceTree(): TreeViewComponent<T> {
        return this.#params.sourceTree;
    }

    public get targetNode(): NodeItem<T> {
        return this.#params.targetNode.nodeItem;
    }

    public get targetTree(): TreeViewComponent<T> {
        return this.#params.targetTree;
    }
}

export class NodeDropEventSansTree<T> extends NodeEvent<T> {
    readonly #params: NodeDropEventArgsSansTree<T>;
    public constructor(params: NodeDropEventArgsSansTree<T>) {
        super("nodeDropSansTree", params.sourceNode, params.event);
        this.#params = params;
    }

    public get event(): MouseEvent | TouchEvent {
        return this.#params.event;
    }

    public get position(): DropPosition {
        return this.#params.position;
    }

    public get sourceNode(): TreeNode<T> {
        return this.#params.sourceNode;
    }

    public get targetNode(): TreeNode<T> {
        return this.#params.targetNode;
    }
}

export interface NodeDropEventArgs<T> {
    event: MouseEvent | TouchEvent;
    position: DropPosition;
    sourceNode: TreeNode<T>;
    sourceTree: TreeViewComponent<T>;
    targetNode: TreeNode<T>;
    targetTree: TreeViewComponent<T>;
}

export type NodeDropEventArgsSansTree<T> = Omit<NodeDropEventArgs<T>, "sourceTree" | "targetTree">;
