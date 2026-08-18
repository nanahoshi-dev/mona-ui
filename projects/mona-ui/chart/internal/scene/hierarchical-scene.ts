import type { ChartHierarchicalKind, ChartRect } from "../../models/chart.models";
import type { ChartTreemapSort, ChartTreemapTile } from "../../models/chart-treemap.models";
import type { ChartSceneBase } from "./chart-scene";
import type { TreemapHitIndex } from "../interaction/treemap-hit-index";
import type { TreemapNavigationIndex } from "../interaction/treemap-keyboard-navigation";

export interface ChartTreemapSeriesStyle {
    readonly baseColor: string;
    readonly borderRadius: number;
    readonly fillOpacity: number;
    readonly labelColor?: string;
    readonly parentFillOpacity: number;
    readonly strokeColor: string;
    readonly strokeWidth: number;
}

export interface SceneTreemapNode {
    readonly aggregateValue: number;
    readonly animationKey: string;
    readonly borderRadius: number;
    readonly bounds: ChartRect;
    readonly childCount: number;
    readonly contentBounds: ChartRect;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly depth: number;
    readonly descendantCount: number;
    readonly fillColor: string;
    readonly formattedLabel: string;
    readonly formattedPath: readonly string[];
    readonly formattedValue: string;
    readonly headerBounds?: ChartRect;
    readonly isCollapsed: boolean;
    readonly isLeaf: boolean;
    readonly label: unknown;
    readonly labelKind: "parent" | "terminal";
    readonly nodeId: string;
    readonly parentId?: string;
    readonly path: readonly unknown[];
    readonly percentageOfParent?: number;
    readonly percentageOfRoot?: number;
    readonly rawValue?: number;
    readonly renderOpacity?: number;
    readonly renderOrder: number;
    readonly showLabel: boolean;
    readonly showValue: boolean;
    readonly siblingIndex: number;
    readonly sourceIndexPath: readonly number[];
    readonly textColor: string;
    readonly treeHeight: number;
}

export interface SceneTreemapLabel {
    readonly bounds: ChartRect;
    readonly formattedLabel: string;
    readonly formattedValue: string;
    readonly kind: "parent" | "terminal";
    readonly nodeId: string;
    readonly showValue: boolean;
    readonly textColor: string;
}

export interface ChartTreemapSeriesScene {
    readonly id: string;
    readonly labels: readonly SceneTreemapLabel[];
    readonly layoutSignature: string;
    readonly name: string;
    readonly nodes: readonly SceneTreemapNode[];
    readonly renderOpacity?: number;
    readonly sort: ChartTreemapSort;
    readonly style: ChartTreemapSeriesStyle;
    readonly tile: ChartTreemapTile;
    readonly topologySignature: string;
    readonly type: "treemap";
}

export interface HierarchicalSceneBase extends ChartSceneBase {
    readonly coordinateSystem: "hierarchical";
    readonly hierarchicalKind: ChartHierarchicalKind;
}

export interface TreemapChartScene extends HierarchicalSceneBase {
    readonly hierarchicalKind: "treemap";
    readonly hitIndex: TreemapHitIndex;
    readonly layoutSignature: string;
    readonly navigationIndex: TreemapNavigationIndex;
    readonly series: readonly ChartTreemapSeriesScene[];
    readonly topologySignature: string;
}

export type HierarchicalChartScene = TreemapChartScene;
