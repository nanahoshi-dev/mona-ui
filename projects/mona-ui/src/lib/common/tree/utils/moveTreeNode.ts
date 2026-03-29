import { NodeDropEvent } from "../models/NodeDropEvent";

/**
 * Moves a node within a generic hierarchical tree structure.
 * @param treeData - The array of tree nodes.
 * @param event - The drag-and-drop event payload.
 * @param idKey - The property key used to identify nodes (e.g., 'id').
 * @param childrenKey - The property key containing the nested items (e.g., 'items').
 * @returns A new array representing the updated tree structure.
 */
export function moveTreeNode<T extends Record<string, any>>(
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
