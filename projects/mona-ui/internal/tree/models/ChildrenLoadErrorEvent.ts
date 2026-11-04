import type { NodeItem } from "./NodeItem";

/**
 * Reports that the children of a node couldn't be loaded from an asynchronous children selector. The node is
 * collapsed again, and expanding it retries the load.
 */
export interface ChildrenLoadErrorEvent<T> {
    /** What the children observable errored with. */
    readonly error: unknown;

    /** The node whose children failed to load. */
    readonly node: NodeItem<T>;
}
