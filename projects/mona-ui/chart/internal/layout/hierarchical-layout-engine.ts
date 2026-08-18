import type { ChartRect } from "../../models/chart.models";
import type { ChartTreemapSeriesRegistration } from "../context/chart-registration-context";
import { TreemapHitIndex } from "../interaction/treemap-hit-index";
import type { HierarchicalChartScene } from "../scene/hierarchical-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { TreemapLayoutEngine } from "./treemap-layout-engine";

export class HierarchicalLayoutEngine {
    public static createEmptyScene(width: number, height: number): HierarchicalChartScene {
        const plotRect: ChartRect = { height, width, x: 0, y: 0 };
        return {
            coordinateSystem: "hierarchical",
            hasRenderableData: false,
            height,
            hierarchicalKind: "treemap",
            hitIndex: new TreemapHitIndex(plotRect, []),
            hitTargets: [],
            interactionBuckets: [],
            layoutSignature: JSON.stringify(["empty", width, height]),
            legendItems: [],
            navigationIndex: { entries: new Map() },
            plotRect,
            series: [],
            topologySignature: JSON.stringify(["empty"]),
            width
        };
    }

    public static layout(
        registration: ChartTreemapSeriesRegistration,
        plotRect: ChartRect,
        width: number,
        height: number,
        styleResolver: ChartStyleResolver,
        rootData?: readonly unknown[] | unknown,
        warnedDiagnosticSignatures?: Set<string>
    ): HierarchicalChartScene {
        return TreemapLayoutEngine.layout(
            registration,
            plotRect,
            width,
            height,
            styleResolver,
            rootData,
            warnedDiagnosticSignatures
        );
    }
}
