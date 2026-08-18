import type { ChartHierarchyNodeContext } from "./chart-hierarchy.models";
import type { ChartRect } from "./chart.models";

export type ChartTreemapTile = "binary" | "dice" | "slice" | "slice-dice" | "squarify";

export type ChartTreemapSort = "ascending" | "descending" | "none";

export interface ChartTreemapLabelTemplateContext<T = unknown> {
    readonly $implicit: ChartHierarchyNodeContext<T>;
    readonly bounds: ChartRect;
    readonly color: string;
    readonly datum: T;
    readonly depth: number;
    readonly formattedLabel: string;
    readonly formattedPath: readonly string[];
    readonly formattedValue: string;
    readonly isCollapsed: boolean;
    readonly isLeaf: boolean;
    readonly label: unknown;
    readonly node: ChartHierarchyNodeContext<T>;
    readonly nodeId: string;
    readonly path: readonly unknown[];
    readonly percentageOfParent?: number;
    readonly percentageOfRoot?: number;
    readonly textColor: string;
    readonly value: number;
}

export interface ChartTreemapNodeVisibilityEvent<T = unknown> {
    readonly dataIndex?: number;
    readonly datum?: T;
    readonly depth?: number;
    readonly formattedLabel?: string;
    readonly label?: unknown;
    readonly nodeId: string;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly seriesType: "treemap";
    readonly visible: boolean;
}
