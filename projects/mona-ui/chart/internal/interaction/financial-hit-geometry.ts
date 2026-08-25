import type { ChartRect } from "../../models/chart.models";
import type { SceneCandlestickMark, SceneOhlcMark } from "../scene/scene-geometry";

export interface FinancialHitGeometry {
    readonly bounds: ChartRect;
    readonly visualBounds: ChartRect;
}

export function createCandlestickFinancialHitGeometry(mark: SceneCandlestickMark): FinancialHitGeometry {
    const visualHalfWidth = mark.bodyWidth / 2;
    const hitHalfWidth = Math.max(visualHalfWidth, 4);

    return {
        bounds: {
            height: Math.max(6, Math.abs(mark.lowY - mark.highY)),
            width: hitHalfWidth * 2,
            x: mark.centerX - hitHalfWidth,
            y: Math.min(mark.highY, mark.lowY)
        },
        visualBounds: mark.bodyBounds
    };
}

export function createOhlcFinancialHitGeometry(mark: SceneOhlcMark): FinancialHitGeometry {
    const hitHalfWidth = Math.max(mark.tickWidth, 4);

    return {
        bounds: {
            height: Math.max(6, Math.abs(mark.lowY - mark.highY)),
            width: hitHalfWidth * 2,
            x: mark.centerX - hitHalfWidth,
            y: Math.min(mark.highY, mark.lowY)
        },
        visualBounds: {
            height: Math.max(1, Math.abs(mark.lowY - mark.highY)),
            width: mark.totalWidth,
            x: mark.centerX - mark.tickWidth,
            y: Math.min(mark.highY, mark.lowY)
        }
    };
}
