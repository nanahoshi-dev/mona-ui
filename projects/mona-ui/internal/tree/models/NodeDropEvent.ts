import type { DropPosition } from "./DropPositionChangeEvent";
import type { ITreeView } from "./ITreeView";
import { NodeEvent } from "./NodeEvent";
import type { NodeItem } from "./NodeItem";
import { TreeNode } from "./TreeNode";

/**
 * A request to move a node: a drop, or a keyboard move (Ctrl+Shift+Arrow), whose original event is then the
 * `KeyboardEvent`.
 */
export class NodeDropEvent<T> extends NodeEvent<T, NodeDropOriginalEvent> {
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

export class NodeDropEventSansTree<T> extends NodeEvent<T, NodeDropOriginalEvent> {
    readonly #params: NodeDropEventArgsSansTree<T>;
    public constructor(params: NodeDropEventArgsSansTree<T>) {
        super("nodeDropSansTree", params.sourceNode, params.event);
        this.#params = params;
    }

    public get event(): NodeDropOriginalEvent {
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

/** The event behind a `nodeDrop`: the pointer event of a drop, or the key press of a keyboard move. */
export type NodeDropOriginalEvent = MouseEvent | TouchEvent | KeyboardEvent;

export interface NodeDropEventArgs<T> {
    event: NodeDropOriginalEvent;
    position: DropPosition;
    sourceNode: TreeNode<T>;
    targetNode: TreeNode<T>;
    treeView: ITreeView<T>;
}

export type NodeDropEventArgsSansTree<T> = Omit<NodeDropEventArgs<T>, "treeView">;
