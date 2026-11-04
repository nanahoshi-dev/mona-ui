import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { NodeItem } from "./NodeItem";
import { TreeNode } from "./TreeNode";

export abstract class NodeEvent<T, E extends Event = MouseEvent | TouchEvent> extends PreventableEvent<E> {
    readonly #node: TreeNode<T>;
    protected constructor(type: string, node: TreeNode<T>, event: E) {
        super(type, event);
        this.#node = node;
    }
    public get nodeItem(): NodeItem<T> {
        return {
            data: this.#node.data,
            hasChildren: this.#node.children().length > 0,
            uid: this.#node.uid
        };
    }
}
