import { signal } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { v4 } from "uuid";
import type { NodeItem } from "./NodeItem";

/** A node of a tree, wrapping its data item. */
export class TreeNode<T> {
    /** Whether the node is checked. The tree keeps it in step with the checked keys. */
    public readonly checked = signal(false);
    /** The node's child nodes, in display order. */
    public readonly children = signal(ImmutableSet.create<TreeNode<T>>());
    /** The data item this node was created from. */
    public readonly data: T;
    /** Whether the last load of this node's children from an asynchronous children selector failed. */
    public readonly loadFailed = signal(false);
    /** Whether the node's children are being loaded from an asynchronous children selector. */
    public readonly loading = signal(false);
    /** A unique id generated for the node when it is created. */
    public readonly uid = v4();
    /**
     * Whether children from an asynchronous children selector have been loaded. Loaded children are cached,
     * so collapsing and re-expanding the node does not request them again.
     */
    public childrenLoaded = false;
    /**
     * The node's position in the tree as dot-separated zero-based indices from the root, such as `"0.2.1"` for
     * the second child of the third child of the first root node.
     */
    public index: string = "";
    /** The node's parent node, or `null` for a root node. */
    public parent: TreeNode<T> | null = null;

    public constructor(data: T) {
        this.data = data;
    }

    public clone(): TreeNode<T> {
        const node = new TreeNode<T>(this.data);
        node.index = this.index;
        node.children.set(ImmutableSet.create(this.children().select(c => c.clone())));
        node.parent = this.parent;
        return node;
    }

    public isDescendantOf(node: TreeNode<T>): boolean {
        let parent = this.parent;
        while (parent != null) {
            if (parent === node) {
                return true;
            }
            parent = parent.parent;
        }
        return false;
    }

    /** A plain snapshot of the node (its data, uid and whether it has children), as the tree view's events carry it. */
    public get nodeItem(): NodeItem<T> {
        return {
            data: this.data,
            hasChildren: this.children().length > 0,
            uid: this.uid
        };
    }
}
