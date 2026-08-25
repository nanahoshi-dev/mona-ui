import { area, line } from "d3-shape";
import type { ChartCurve } from "../../../models/chart-series.models";
import type { SceneRangeAreaPoint } from "../../scene/scene-geometry";
import { resolveCurveFactory } from "./chart-curve-factory";

export interface RangeAreaPathOptions {
    readonly connectNulls?: boolean;
    readonly curve?: ChartCurve;
    readonly points: readonly SceneRangeAreaPoint[];
}

export function buildRangeAreaFillPath(options: RangeAreaPathOptions): string | null {
    const { connectNulls = false, curve = "linear", points } = options;
    const validPoints = connectNulls ? points.filter(p => p.defined) : points;
    if (validPoints.length === 0) {
        return null;
    }

    const generator = area<SceneRangeAreaPoint>()
        .x(p => p.x)
        .y0(p => (p.defined && p.fromPoint ? p.fromPoint.y : 0))
        .y1(p => (p.defined && p.toPoint ? p.toPoint.y : 0))
        .curve(resolveCurveFactory(curve));

    if (!connectNulls) {
        generator.defined(p => p.defined && p.fromPoint !== undefined && p.toPoint !== undefined);
    }

    return generator(validPoints as SceneRangeAreaPoint[]);
}

export function buildRangeAreaFromStrokePath(options: RangeAreaPathOptions): string | null {
    const { connectNulls = false, curve = "linear", points } = options;
    const validPoints = connectNulls ? points.filter(p => p.defined) : points;
    if (validPoints.length === 0) {
        return null;
    }

    const generator = line<SceneRangeAreaPoint>()
        .x(p => p.x)
        .y(p => (p.defined && p.fromPoint ? p.fromPoint.y : 0))
        .curve(resolveCurveFactory(curve));

    if (!connectNulls) {
        generator.defined(p => p.defined && p.fromPoint !== undefined);
    }

    return generator(validPoints as SceneRangeAreaPoint[]);
}

export function buildRangeAreaToStrokePath(options: RangeAreaPathOptions): string | null {
    const { connectNulls = false, curve = "linear", points } = options;
    const validPoints = connectNulls ? points.filter(p => p.defined) : points;
    if (validPoints.length === 0) {
        return null;
    }

    const generator = line<SceneRangeAreaPoint>()
        .x(p => p.x)
        .y(p => (p.defined && p.toPoint ? p.toPoint.y : 0))
        .curve(resolveCurveFactory(curve));

    if (!connectNulls) {
        generator.defined(p => p.defined && p.toPoint !== undefined);
    }

    return generator(validPoints as SceneRangeAreaPoint[]);
}
