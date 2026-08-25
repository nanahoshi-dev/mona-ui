import { line } from "d3-shape";
import type { ChartCurve } from "../../../models/chart-series.models";
import type { ScenePoint } from "../../scene/scene-geometry";
import { resolveCurveFactory } from "./chart-curve-factory";

export interface LinePathOptions {
    readonly connectNulls?: boolean;
    readonly curve?: ChartCurve;
    readonly points: readonly ScenePoint[];
}

export function buildLinePath(options: LinePathOptions): string | null {
    const { connectNulls = false, curve = "linear", points } = options;
    const validPoints = connectNulls ? points.filter(p => p.defined) : points;
    if (validPoints.length === 0) {
        return null;
    }

    const generator = line<ScenePoint>()
        .x(p => p.x)
        .y(p => p.y)
        .curve(resolveCurveFactory(curve));

    if (!connectNulls) {
        generator.defined(p => p.defined);
    }

    return generator(validPoints as ScenePoint[]);
}
