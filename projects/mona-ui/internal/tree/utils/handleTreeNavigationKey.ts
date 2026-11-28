import { isTypeaheadKey } from "@nanahoshi/mona-ui/internal";
import type { TreeService } from "../services/tree.service";

/** What {@link handleTreeNavigationKey} needs besides the key. */
export interface TreeNavigationKeyContext<T> {
    /** Whether the tree is laid out right to left, which swaps the expand and collapse keys. */
    readonly rtl: boolean;
    readonly treeService: TreeService<T>;
    /**
     * Takes a typed character for typeahead, or `""` after a key that moves, which ends the search. Space isn't passed:
     * a tree uses it to check nodes.
     */
    readonly typeahead: (key: string) => void;
}

/**
 * Moves through a tree the way the WAI-ARIA tree pattern does: the arrow keys move the active node and open or close
 * it, Home and End go to the first and last node, `*` opens the node's siblings, and printable characters go to
 * typeahead. Space and Enter are left to the caller, which checks or selects with them. Keys with Ctrl, Alt or Meta
 * are left alone.
 *
 * The tree uses it for its own keys, and a dropdown tree for the keys of its field, which keeps focus while its popup
 * tree follows.
 * @returns whether the key was handled, in which case its default action is prevented.
 */
export function handleTreeNavigationKey<T>(event: KeyboardEvent, context: TreeNavigationKeyContext<T>): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return false;
    }
    const { rtl, treeService } = context;
    const navigatedNode = treeService.navigatedNode();
    const collapseKey = rtl ? "ArrowRight" : "ArrowLeft";
    const expandKey = rtl ? "ArrowLeft" : "ArrowRight";
    switch (event.key) {
        case "ArrowUp":
            treeService.navigate("previous");
            break;
        case "ArrowDown":
            treeService.navigate("next");
            break;
        case collapseKey:
            // Collapse an open node, otherwise (closed, an end node, a node that can't be collapsed) go to the parent.
            if (navigatedNode && !treeService.toggleNodeExpand(navigatedNode, false) && navigatedNode.parent) {
                treeService.navigatedNode.set(navigatedNode.parent);
            }
            break;
        case expandKey:
            // Open a closed node, otherwise go to its first child.
            if (!navigatedNode || !treeService.hasChildren(navigatedNode)) {
                break;
            }
            if (!treeService.isExpanded(navigatedNode)) {
                treeService.toggleNodeExpand(navigatedNode, true);
            } else if (!navigatedNode.children().isEmpty()) {
                treeService.navigate("next");
            }
            break;
        case "*":
            if (navigatedNode) {
                treeService.expandSiblings(navigatedNode);
            }
            break;
        case "Home":
            treeService.navigate("first");
            break;
        case "End":
            treeService.navigate("last");
            break;
        default:
            if (event.key === " " || !isTypeaheadKey(event.key, event)) {
                return false;
            }
            context.typeahead(event.key);
            event.preventDefault();
            return true;
    }
    // A key that moves ends a typeahead search: the next character starts a new one.
    context.typeahead("");
    event.preventDefault();
    return true;
}
