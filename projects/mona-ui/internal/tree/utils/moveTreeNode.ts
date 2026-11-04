import { NodeDropEvent } from "../models/NodeDropEvent";

/**
 * Moves a node within a generic hierarchical tree structure.
 * @param treeData - The array of tree nodes.
 * @param event - The drag-and-drop event payload.
 * @param idKey - The property key used to identify nodes (e.g., 'id').
 * @param childrenKey - The property key containing the nested items (e.g., 'items').
 * @returns A new top-level array representing the updated tree structure.
 * Nested children arrays are updated in place, so untouched data items keep their identity (and their tree state).
 * The move is skipped, returning the tree unchanged, when the position is "outside", the target is missing,
 * or the target is the dragged node or one of its descendants, so a node is never lost or made its own ancestor.
 */
export function moveTreeNode<T extends object>(
    treeData: Iterable<T>,
    event: NodeDropEvent<T>,
    idKey: keyof T,
    childrenKey: keyof T
): T[] {
    const updatedTree = [...treeData];
    const draggedId = event.nodeItem.data[idKey];
    const targetId = event.targetNode.data[idKey];
    const position = event.position;
    let draggedNode: T | null = null;

    if (position === "outside" || draggedId === targetId) {
        return updatedTree;
    }

    function findNode(nodes: Iterable<T>, id: unknown): T | null {
        for (const node of nodes) {
            if (node[idKey] === id) {
                return node;
            }
            const children = node[childrenKey] as T[] | undefined;
            const found = Array.isArray(children) ? findNode(children, id) : null;
            if (found) {
                return found;
            }
        }
        return null;
    }

    const draggedSource = findNode(updatedTree, draggedId);
    const draggedChildren = draggedSource?.[childrenKey] as T[] | undefined;
    if (
        draggedSource == null ||
        findNode(updatedTree, targetId) == null ||
        (Array.isArray(draggedChildren) && findNode(draggedChildren, targetId) != null)
    ) {
        return updatedTree;
    }

    function extractNode(nodes: T[]): boolean {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i][idKey] === draggedId) {
                draggedNode = nodes.splice(i, 1)[0];
                return true;
            }

            const children = nodes[i][childrenKey] as T[] | undefined;
            if (children && Array.isArray(children)) {
                if (extractNode(children)) {
                    return true;
                }
            }
        }
        return false;
    }

    function insertNode(nodes: T[]): boolean {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i][idKey] === targetId) {
                if (position === "inside") {
                    if (!nodes[i][childrenKey]) {
                        nodes[i][childrenKey] = [] as T[keyof T];
                    }
                    const children = nodes[i][childrenKey] as T[];
                    children.push(draggedNode!);
                } else if (position === "before") {
                    nodes.splice(i, 0, draggedNode!);
                } else if (position === "after") {
                    nodes.splice(i + 1, 0, draggedNode!);
                }
                return true;
            }

            const children = nodes[i][childrenKey] as T[] | undefined;
            if (children && Array.isArray(children)) {
                if (insertNode(children)) {
                    return true;
                }
            }
        }
        return false;
    }

    extractNode(updatedTree);
    if (draggedNode) {
        insertNode(updatedTree);
    }
    return updatedTree;
}
