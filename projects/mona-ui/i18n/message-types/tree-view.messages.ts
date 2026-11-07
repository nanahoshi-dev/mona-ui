export interface MonaTreeViewMessages {
    /** Start of an expanded node's expander name, followed by the node's text ("Collapse Documents"). */
    readonly collapse: string;

    /** Start of a collapsed node's expander name, followed by the node's text ("Expand Documents"). */
    readonly expand: string;

    /** @deprecated No longer rendered; the filter input's name comes from {@link filterLabel}. */
    readonly filter: string;

    /** Accessible name of the filter input, from the tree view's name ("Filter Files"). */
    filterLabel(tree: string): string;

    /** Accessible name of the filter input when the tree view has no `aria-label`. */
    readonly filterTree: string;

    /** Announced, and read with the node, when a node's children couldn't be loaded. */
    loadError(node: string): string;

    /** Announced while a node's children take a while to load, and the expander's name meanwhile. */
    loadingNode(node: string): string;

    /** Announced when a keyboard move (Ctrl+Shift+Arrow) put a node after another node. */
    movedAfter(node: string, target: string): string;

    /** Announced when a keyboard move put a node before another node. */
    movedBefore(node: string, target: string): string;

    /** Announced when a keyboard move put a node inside another node, as its last child. */
    movedInto(node: string, target: string): string;

    /** Shown, and describes the tree, when the tree view has no data. */
    readonly noData: string;

    /** Shown, describes the tree and is announced, when no node matches the filter. */
    readonly noMatches: string;

    /** Announced after the user filters, with the number of nodes that match. */
    results(count: number): string;

    /** Name of the expander of a node whose children couldn't be loaded. */
    retryLoading(node: string): string;
}