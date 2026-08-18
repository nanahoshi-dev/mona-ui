export interface ChartHierarchyNodeContext<T = unknown> {
    readonly aggregateValue: number;
    readonly childCount: number;
    readonly dataIndex: number;
    readonly datum: T;
    readonly depth: number;
    readonly descendantCount: number;
    readonly formattedLabel: string;
    readonly formattedPath: readonly string[];
    readonly formattedValue: string;
    readonly isCollapsed: boolean;
    readonly isLeaf: boolean;
    readonly label: unknown;
    readonly nodeId: string;
    readonly parentId?: string;
    readonly path: readonly unknown[];
    readonly percentageOfParent?: number;
    readonly percentageOfRoot?: number;
    readonly rawValue?: number;
    readonly siblingIndex: number;
    readonly sourceIndexPath: readonly number[];
    readonly treeHeight: number;
}

export interface ChartHierarchyPointMetadata {
    readonly aggregateValue: number;
    readonly childCount: number;
    readonly dataIndex: number;
    readonly depth: number;
    readonly descendantCount: number;
    readonly formattedLabel: string;
    readonly formattedPath: readonly string[];
    readonly formattedValue: string;
    readonly isCollapsed: boolean;
    readonly isLeaf: boolean;
    readonly label: unknown;
    readonly nodeId: string;
    readonly parentId?: string;
    readonly path: readonly unknown[];
    readonly percentageOfParent?: number;
    readonly percentageOfRoot?: number;
    readonly rawValue?: number;
    readonly siblingIndex: number;
    readonly sourceIndexPath: readonly number[];
    readonly treeHeight: number;
}
