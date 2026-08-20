import type { ChartBrushMode } from "../../models/chart-brush.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export class CartesianHitAxisCompatibility {
    public static isCompatible(
        hit: SceneHitTarget,
        mode: ChartBrushMode,
        targetXAxisId?: string,
        targetYAxisId?: string
    ): boolean {
        const hitX = hit.xAxisId;
        const hitY = hit.yAxisId;

        const xMatches = !targetXAxisId || targetXAxisId === hitX;
        const yMatches = !targetYAxisId || targetYAxisId === hitY;

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
