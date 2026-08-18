import type { ChartRect } from "../../models/chart.models";
import type { ChartTreemapSeriesRegistration } from "../context/chart-registration-context";
import type { HierarchicalChartScene } from "../scene/hierarchical-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { TreemapLayoutEngine } from "./treemap-layout-engine";

export class HierarchicalLayoutEngine {
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
