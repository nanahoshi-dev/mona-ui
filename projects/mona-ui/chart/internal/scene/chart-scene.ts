import type { ChartXAxisType, ChartYAxisType } from "../../models/chart-axis.models";
import type { ChartCoordinateSystem, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartHeatmapCategory,
    ChartHeatmapColorScaleScene,
    ChartHeatmapSeriesScene
} from "../../models/chart-heatmap.models";
import type { ChartAxisScene, ChartSeriesScene } from "./cartesian-scene";
import type { ChartAngularAxisScene, ChartRadialAxisScene, ChartRadialSeriesScene } from "./polar-axis-scene";
import type { ChartSectorSeriesScene } from "./polar-scene";
import type { PolarArcChartScene } from "./polar-arc-scene";
export type { PolarArcChartScene };
import type { CartesianFinancialIndex } from "../interaction/cartesian-financial-index";
import type { CartesianPointSpatialIndex } from "../interaction/cartesian-point-spatial-index";
import type { HeatmapCellIndex } from "../interaction/heatmap-cell-index";
import type { ChartInteractionBucket, ChartInteractionXKey, SceneHitTarget } from "./scene-geometry";
import type { ChartStackMode } from "../../models/chart-stack.models";
import type { ChartViewportState } from "../../models/chart-viewport.models";
import type { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";

import type { CartesianFunnelChartScene } from "./funnel-scene";
import type { CartesianWaterfallChartScene } from "./waterfall-scene";
export type { CartesianFunnelChartScene, CartesianWaterfallChartScene };

export interface CartesianStackSceneConfig {
    readonly geometryType: "area" | "bar";
    readonly groupId: string;
    readonly mode: ChartStackMode;
    readonly registeredSeriesIds: readonly string[];
}

/** Internal diagnostics describing per-series render reduction for one projection. */
export interface ChartSeriesDensityMetadata {
    readonly actualRenderedMarkerCount?: number;
    readonly algorithm: string;
    readonly centerVisibleCount?: number;
    readonly renderCandidateCount?: number;
    readonly renderedCount: number;
    readonly sampled: boolean;
    /** Number of points/markers actually materialized in the scene. */
    readonly scenePointCount?: number;
    readonly selectedCount?: number;
    /** Number of selected real source marks before topology-only scene sentinels. */
    readonly selectedDefinedCount?: number;
    readonly sourceCount: number;
    readonly visibleSourceCount: number;
}

export interface ChartSceneBase {
    coordinateSystem: ChartCoordinateSystem;
    hasRenderableData: boolean;
    height: number;
    hitTargets: readonly SceneHitTarget[];
    interactionBuckets: readonly ChartInteractionBucket[];
    legendItems: readonly ChartLegendItem[];
    plotRect: ChartRect;
    width: number;
}

export type ChartCartesianKind = "funnel" | "heatmap" | "waterfall" | "xy";
export type CartesianXYOrientation = "horizontal" | "vertical";
export type ChartInteractionAxis = "x" | "y";

export interface CartesianSceneBase extends ChartSceneBase {
    axes: readonly ChartAxisScene[];
    cartesianKind: ChartCartesianKind;
    coordinateSystem: "cartesian";
}

export interface CartesianAxisTopologyItem {
    readonly axisId: string;
    readonly dimension: "x" | "y";
    readonly isPrimary?: boolean;
    readonly position: import("../../models/chart-axis.models").ChartAxisPosition;
    readonly resolvedType: import("../scale/chart-scale").ResolvedChartCartesianAxisType;
    readonly stackIndex: number;
    readonly valid?: boolean;
    readonly visible?: boolean;
}

export interface CartesianXYChartScene extends CartesianSceneBase {
    axisTopology?: readonly CartesianAxisTopologyItem[];
    axisTopologySignature?: string;
    barHitTargets?: readonly SceneHitTarget[];
    cartesianKind: "xy";
    coordinateSpace?: CartesianAxisCoordinateSpace;
    /** Exact raw interaction provider for dense series, frozen to this projection (internal). */
    denseInteraction?: ReadonlyMap<
        string,
        import("../density/cartesian-dense-interaction-provider").CartesianDenseInteractionProvider
    >;
    /** Retained structural density authority for this projection revision (internal). */
    densityRuntime?: import("../density/cartesian-density-runtime").CartesianDensityRuntime;
    financialIndex?: CartesianFinancialIndex;
    interactionAxis?: ChartInteractionAxis;
    interactionBucketLookup?: ReadonlyMap<ChartInteractionXKey, ChartInteractionBucket>;
    interactionBucketsByAxisId?: ReadonlyMap<string, ReadonlyMap<ChartInteractionXKey, ChartInteractionBucket>>;
    interactionGeometryIndex?: import("../interaction/cartesian-interaction-geometry-index").CartesianInteractionGeometryIndex;
    markerSpatialIndex?: CartesianPointSpatialIndex;
    orientation?: CartesianXYOrientation;
    pointSpatialIndex?: CartesianPointSpatialIndex;
    primaryXAxisId?: string;
    primaryYAxisId?: string;
    series: readonly ChartSeriesScene[];
    seriesDensityMetadataById?: ReadonlyMap<string, ChartSeriesDensityMetadata>;
    stackConfiguration?: readonly CartesianStackSceneConfig[];
    stackSignature?: string;
    viewport?: ChartViewportState;
    xAxisType?: ChartXAxisType;
    xTimeSpanMs?: number;
    yAxisType?: ChartYAxisType;
}

export interface CartesianHeatmapChartScene extends CartesianSceneBase {
    cartesianKind: "heatmap";
    cellIndex: HeatmapCellIndex;
    colorScale: ChartHeatmapColorScaleScene;
    gridSignature: string;
    series: readonly ChartHeatmapSeriesScene[];
    xCategories: readonly ChartHeatmapCategory[];
    yCategories: readonly ChartHeatmapCategory[];
}

export type CartesianChartScene =
    CartesianFunnelChartScene | CartesianHeatmapChartScene | CartesianWaterfallChartScene | CartesianXYChartScene;

export interface PolarSceneBase extends ChartSceneBase {
    center: ChartPoint;
    coordinateSystem: "polar";
}

export interface PolarSectorChartScene extends PolarSceneBase {
    polarKind: "sector";
    series: readonly ChartSectorSeriesScene[];
}

export interface PolarAxisChartScene extends PolarSceneBase {
    angularAxis: ChartAngularAxisScene;
    axisMode: "polar" | "radar";
    outerRadius: number;
    polarKind: "axis";
    radialAxis: ChartRadialAxisScene;
    series: readonly ChartRadialSeriesScene[];
}

import type { HierarchicalChartScene, TreemapChartScene } from "./hierarchical-scene";
export type { HierarchicalChartScene, TreemapChartScene };

export type PolarChartScene = PolarArcChartScene | PolarAxisChartScene | PolarSectorChartScene;

export type ChartScene = CartesianChartScene | HierarchicalChartScene | PolarChartScene;
