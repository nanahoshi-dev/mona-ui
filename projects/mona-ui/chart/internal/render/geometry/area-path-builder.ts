import { area, line } from "d3-shape";
import type { ChartCurve } from "../../../models/chart-series.models";
import type { SceneAreaPoint } from "../../scene/scene-geometry";
import { resolveCurveFactory } from "./chart-curve-factory";

export interface AreaPathOptions {
    readonly baselineY: number;
    readonly connectNulls?: boolean;
    readonly curve?: ChartCurve;
    readonly points: readonly SceneAreaPoint[];
}

export function buildAreaFillPath(options: AreaPathOptions): string | null {
    const { baselineY, connectNulls = false, curve = "linear", points } = options;
    const validPoints = connectNulls ? points.filter(p => p.defined) : points;
    if (validPoints.length === 0) {
        return null;
    }

    const generator = area<SceneAreaPoint>()
        .x(p => p.x)
        .y0(p => p.baseY ?? baselineY)
        .y1(p => p.y)
        .curve(resolveCurveFactory(curve));

    if (!connectNulls) {
        generator.defined(p => p.defined);
    }

    return generator(validPoints as SceneAreaPoint[]);
}

export function buildAreaStrokePath(options: AreaPathOptions): string | null {
    const { connectNulls = false, curve = "linear", points } = options;
    const validPoints = connectNulls ? points.filter(p => p.defined) : points;
    if (validPoints.length === 0) {
        return null;
    }

    const generator = line<SceneAreaPoint>()
        .x(p => p.x)
        .y(p => p.y)
        .curve(resolveCurveFactory(curve));

    if (!connectNulls) {
        generator.defined(p => p.defined);
    }

    return generator(validPoints as SceneAreaPoint[]);
}
