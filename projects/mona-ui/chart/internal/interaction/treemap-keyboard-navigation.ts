export interface TreemapNavigationEntry {
    readonly firstChildId?: string;
    readonly lastChildId?: string;
    readonly nextDepthFirstId?: string;
    readonly nextSiblingId?: string;
    readonly nodeId: string;
    readonly parentId?: string;
    readonly previousDepthFirstId?: string;
    readonly previousSiblingId?: string;
}

export interface TreemapNavigationIndex {
    readonly entries: ReadonlyMap<string, TreemapNavigationEntry>;
    readonly firstNodeId?: string;
    readonly lastNodeId?: string;
}

export class TreemapKeyboardNavigation {
    public static navigate(
        currentId: string | undefined,
        key: string,
        navigationIndex: TreemapNavigationIndex
    ): string | undefined {
        const { entries, firstNodeId, lastNodeId } = navigationIndex;

        if (!currentId) {
            if (key === "Home" || key === "ArrowRight" || key === "ArrowDown") {
                return firstNodeId;
            }
            if (key === "End") {
                return lastNodeId;
            }
            return firstNodeId;
        }

        const entry = entries.get(currentId);
        if (!entry) {
            return firstNodeId;
        }

        switch (key) {
            case "ArrowRight":
                // If has child, enter first child; otherwise next sibling, otherwise depth-first next
                return entry.firstChildId ?? entry.nextSiblingId ?? entry.nextDepthFirstId ?? currentId;

            case "ArrowLeft":
                // Return to parent if exists
                return entry.parentId ?? currentId;

            case "ArrowDown":
                // Next sibling if exists, otherwise depth-first next
                return entry.nextSiblingId ?? entry.nextDepthFirstId ?? currentId;

            case "ArrowUp":
                // Previous sibling if exists, otherwise depth-first previous, otherwise parent
                return entry.previousSiblingId ?? entry.previousDepthFirstId ?? entry.parentId ?? currentId;

            case "Home":
                return firstNodeId;

            case "End":
                return lastNodeId;

            default:
                return currentId;
        }
    }
}
