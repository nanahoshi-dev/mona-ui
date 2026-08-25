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

        switch (key) {
            case "ArrowRight": {
                if (!currentId) {
                    return firstNodeId;
                }
                const entry = entries.get(currentId);
                if (!entry) {
                    return firstNodeId;
                }
                return entry.firstChildId ?? entry.nextSiblingId ?? entry.nextDepthFirstId ?? currentId;
            }

            case "ArrowLeft": {
                if (!currentId) {
                    return undefined;
                }
                const entry = entries.get(currentId);
                if (!entry) {
                    return undefined;
                }
                return entry.parentId ?? currentId;
            }

            case "ArrowDown": {
                if (!currentId) {
                    return firstNodeId;
                }
                const entry = entries.get(currentId);
                if (!entry) {
                    return firstNodeId;
                }
                return entry.nextSiblingId ?? entry.nextDepthFirstId ?? currentId;
            }

            case "ArrowUp": {
                if (!currentId) {
                    return undefined;
                }
                const entry = entries.get(currentId);
                if (!entry) {
                    return undefined;
                }
                return entry.previousSiblingId ?? entry.previousDepthFirstId ?? entry.parentId ?? currentId;
            }

            case "Home":
                return firstNodeId;

            case "End":
                return lastNodeId;

            default:
                return undefined;
        }
    }
}
