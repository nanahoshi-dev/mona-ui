import type { ChartBrushMode } from "../../models/chart-brush.models";
import type { ChartBrushRegistration } from "../context/chart-registration-context";
import type { CartesianXYChartScene } from "../scene/chart-scene";

export interface ResolvedCartesianBrushTarget {
    readonly isValidX: boolean;
    readonly isValidY: boolean;
    readonly mode: ChartBrushMode;
    readonly xAxisId?: string;
    readonly yAxisId?: string;
}

export class CartesianBrushTargetResolver {
    public static resolve(
        scene: CartesianXYChartScene,
        registration?: ChartBrushRegistration | null,
        warnFn?: (msg: string) => void
    ): ResolvedCartesianBrushTarget {
        const mode = registration?.mode?.() ?? "xy";
        const explicitX = registration?.xAxisId?.();
        const explicitY = registration?.yAxisId?.();

        const coordSpace = scene.coordinateSpace;
        const primaryX =
            scene.primaryXAxisId ??
            (coordSpace?.x.keys().next().value as string | undefined) ??
            scene.axes?.find(a => a.axis === "x" && a.isPrimary)?.axisId ??
            scene.axes?.find(a => a.axis === "x")?.axisId;
        const primaryY =
            scene.primaryYAxisId ??
            (coordSpace?.y.keys().next().value as string | undefined) ??
            scene.axes?.find(a => a.axis === "y" && a.isPrimary)?.axisId ??
            scene.axes?.find(a => a.axis === "y")?.axisId;

        const hasXAxis = (id: string) =>
            coordSpace ? coordSpace.x.has(id) : (scene.axes?.some(a => a.axis === "x" && a.axisId === id) ?? true);
        const hasYAxis = (id: string) =>
            coordSpace ? coordSpace.y.has(id) : (scene.axes?.some(a => a.axis === "y" && a.axisId === id) ?? true);

        let effectiveX: string | undefined;
        let isValidX = true;
        if (mode === "x" || mode === "xy") {
            if (explicitX !== undefined) {
                if (!hasXAxis(explicitX)) {
                    isValidX = false;
                    effectiveX = primaryX;
                    warnFn?.(`[Mona Chart] Brush xAxisId "${explicitX}" does not exist in chart coordinate space.`);
                } else {
                    effectiveX = explicitX;
                }
            } else {
                effectiveX = primaryX;
                if (effectiveX && !hasXAxis(effectiveX)) {
                    isValidX = false;
                }
            }
        }

        let effectiveY: string | undefined;
        let isValidY = true;
        if (mode === "y" || mode === "xy") {
            if (explicitY !== undefined) {
                if (!hasYAxis(explicitY)) {
                    isValidY = false;
                    effectiveY = primaryY;
                    warnFn?.(`[Mona Chart] Brush yAxisId "${explicitY}" does not exist in chart coordinate space.`);
                } else {
                    effectiveY = explicitY;
                }
            } else {
                effectiveY = primaryY;
                if (effectiveY && !hasYAxis(effectiveY)) {
                    isValidY = false;
                }
            }
        }

        return {
            isValidX,
            isValidY,
            mode,
            xAxisId: effectiveX,
            yAxisId: effectiveY
        };
    }
}
