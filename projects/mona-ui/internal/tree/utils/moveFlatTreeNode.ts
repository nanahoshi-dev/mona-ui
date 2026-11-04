import { NodeDropEvent } from "../models/NodeDropEvent";

/**
 * Moves a node within a generic flat tree structure that uses parentId references.
 * @param treeData - The flat array of tree nodes.
 * @param event - The drag-and-drop event payload.
 * @param idKey - The property key used to uniquely identify each node (e.g., 'id').
 * @param parentIdKey - The property key holding the parent node's id, or null for roots (e.g., 'parentId').
 * @returns A new array representing the updated flat tree, with the moved node's parentIdKey updated.
 * The array is returned unchanged when the position is "outside" or the target is the dragged node or one of its
 * descendants, which would otherwise create a parent cycle.
 */
export function moveFlatTreeNode<T extends object>(
    treeData: Iterable<T>,
    event: NodeDropEvent<T>,
    idKey: keyof T,
    parentIdKey: keyof T
): T[] {
    const workingArray = [...treeData];
    const draggedId = event.nodeItem.data[idKey];
    const targetId = event.targetNode.data[idKey];
    const position = event.position;

    if (position === "outside" || draggedId === targetId) {
        return workingArray;
    }

    const itemsById = new Map<unknown, T>(workingArray.map(item => [item[idKey], item]));
    const visited = new Set<unknown>();
    for (let current = itemsById.get(targetId); current != null; current = itemsById.get(current[parentIdKey])) {
        if (current[idKey] === draggedId) {
            return workingArray;
        }
        if (visited.has(current[idKey])) {
            break;
        }
        visited.add(current[idKey]);
    }

    const draggedIndex = workingArray.findIndex(item => item[idKey] === draggedId);
    if (draggedIndex === -1) {
        return workingArray;
    }
    const [draggedNode] = workingArray.splice(draggedIndex, 1);

    const targetIndex = workingArray.findIndex(item => item[idKey] === targetId);
    if (targetIndex === -1) {
        workingArray.splice(draggedIndex, 0, draggedNode);
        return workingArray;
    }

    const targetNode = workingArray[targetIndex];

    if (position === "before") {
        const updatedNode = { ...draggedNode, [parentIdKey]: targetNode[parentIdKey] };
        workingArray.splice(targetIndex, 0, updatedNode);
    } else if (position === "after") {
        const updatedNode = { ...draggedNode, [parentIdKey]: targetNode[parentIdKey] };
        workingArray.splice(targetIndex + 1, 0, updatedNode);
    } else if (position === "inside") {
        const updatedNode = { ...draggedNode, [parentIdKey]: targetNode[idKey] };

        function findLastDescendantIndex(anchorId: unknown): number {
            let lastIndex = workingArray.findIndex(item => item[idKey] === anchorId);
            for (let i = 0; i < workingArray.length; i++) {
                if (workingArray[i][parentIdKey] === anchorId) {
                    const childLastIndex = findLastDescendantIndex(workingArray[i][idKey]);
                    if (childLastIndex > lastIndex) {
                        lastIndex = childLastIndex;
                    }
                }
            }
            return lastIndex;
        }

        const insertAfterIndex = findLastDescendantIndex(targetId);
        workingArray.splice(insertAfterIndex + 1, 0, updatedNode);
    }

    return workingArray;
}
