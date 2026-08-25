import type { ChartBrushMode } from "../../models/chart-brush.models";
import type { ResolvedCartesianBrushTarget } from "../brush/cartesian-brush-target-resolver";
import type { SceneHitTarget } from "../scene/scene-geometry";

export class CartesianHitAxisCompatibility {
    public static isCompatible(
        hit: SceneHitTarget,
        targetOrMode: ResolvedCartesianBrushTarget | ChartBrushMode,
        targetXAxisId?: string,
        targetYAxisId?: string,
        primaryXAxisId?: string,
        primaryYAxisId?: string
    ): boolean {
        let mode: ChartBrushMode;
        let targetX: string | undefined;
        let targetY: string | undefined;
        let isValidX = true;
        let isValidY = true;

        if (typeof targetOrMode === "object") {
            mode = targetOrMode.mode;
            targetX = targetOrMode.xAxisId;
            targetY = targetOrMode.yAxisId;
            isValidX = targetOrMode.isValidX;
            isValidY = targetOrMode.isValidY;
        } else {
            mode = targetOrMode;
            targetX = targetXAxisId ?? primaryXAxisId;
            targetY = targetYAxisId ?? primaryYAxisId;
        }

        const hitX = hit.xAxisId ?? primaryXAxisId;
        const hitY = hit.yAxisId ?? primaryYAxisId;

        const xMatches = isValidX && (targetX === undefined || targetX === hitX);
        const yMatches = isValidY && (targetY === undefined || targetY === hitY);

        switch (mode) {
            case "x":
                return xMatches;
            case "y":
                return yMatches;
            case "xy":
            default:
                return xMatches && yMatches;
        }
    }
}
