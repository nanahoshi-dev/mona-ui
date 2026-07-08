import { DropPosition } from "./DropPositionChangeEvent";
import { ITreeView } from "./ITreeView";
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

    public get targetNode(): NodeItem<T> {
        return this.#params.targetNode.nodeItem;
    }

    public get treeView(): ITreeView<T> {
        return this.#params.treeView;
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
    targetNode: TreeNode<T>;
    treeView: ITreeView<T>;
}

export type NodeDropEventArgsSansTree<T> = Omit<NodeDropEventArgs<T>, "treeView">;
