import {
    area,
    type CurveFactory,
    curveLinear,
    curveMonotoneX,
    curveNatural,
    curveStep,
    curveStepAfter,
    line
} from "d3-shape";
import type { SparklineCurve } from "../models/SparklineCurve";
import type { SparklineMarker } from "../models/SparklineMarker";
import type { SparklineType } from "../models/SparklineType";

/**
 * The size of the sparkline's drawing, its SVG `viewBox`, in both directions. The SVG stretches it to the sparkline's
 * box, and strokes and dots keep their width in pixels, as they don't scale.
 */
export const SPARKLINE_VIEW_SIZE = 100;

/** How much of its slot a column or win-loss bar takes; the rest is the gap between bars. */
const BAR_WIDTH_RATIO = 0.7;

/** The curves a line or an area joins its values with, the ones a chart's line series has. */
const CURVES: Readonly<Record<SparklineCurve, CurveFactory>> = {
    linear: curveLinear,
    "monotone-x": curveMonotoneX,
    natural: curveNatural,
    step: curveStep,
    "step-after": curveStepAfter
};

/** A win-loss bar's height, above or below the middle, leaving a gap there for the ticks of zeros. */
const WIN_LOSS_BAR_HEIGHT = 46;

/** The height of a win-loss sparkline's tick for a zero, across the middle. */
const WIN_LOSS_TICK_HEIGHT = 8;

export type SparklineBarKind = "negative" | "positive" | "zero";

export interface SparklineBar {
    readonly height: number;
    readonly kind: SparklineBarKind;
    readonly width: number;
    readonly x: number;
    readonly y: number;
}

/** What a sparkline draws, in the drawing's coordinates. */
export interface SparklineGeometry {
    /** The area under the line of an area sparkline, one closed shape for each run of values. */
    readonly areaPath: string;
    /** The bars of a column or win-loss sparkline. */
    readonly bars: readonly SparklineBar[];
    /** Where zero is, for a column sparkline with values on both sides of it; `null` otherwise. */
    readonly baselineY: number | null;
    /** Dots for the values a line has no segment for, between gaps or alone. */
    readonly dotsPath: string;
    /** The line through the values, joined by the curve and broken where a value is missing. */
    readonly linePath: string;
    /** Dots for the marked values. */
    readonly markersPath: string;
    /** Where the reference value is; `null` without one, or for a win-loss sparkline. */
    readonly referenceY: number | null;
}

export interface SparklineGeometryOptions {
    /** How the line, and the top edge of an area, join the values. */
    readonly curve: SparklineCurve;
    readonly markers: readonly SparklineMarker[];
    /** The value at the top of the drawing; the highest value (or zero, or the reference value) when `null`. */
    readonly max: number | null;
    /** The value at the bottom of the drawing; the lowest value (or zero, or the reference value) when `null`. */
    readonly min: number | null;
    readonly referenceValue: number | null;
    readonly type: SparklineType;
}

/** The figures a sparkline's summary reads out. */
export interface SparklineStats {
    readonly count: number;
    readonly draws: number;
    readonly first: number;
    readonly last: number;
    readonly losses: number;
    readonly max: number;
    readonly min: number;
    readonly wins: number;
}

interface Domain {
    readonly high: number;
    readonly low: number;
}

const EMPTY_GEOMETRY: SparklineGeometry = {
    areaPath: "",
    bars: [],
    baselineY: null,
    dotsPath: "",
    linePath: "",
    markersPath: "",
    referenceY: null
};

/** A sparkline's values, with anything that isn't a finite number as `null`, a gap. */
export function readSparklineValues(data: Iterable<number | null | undefined>): (number | null)[] {
    return Array.from(data, value => (typeof value === "number" && Number.isFinite(value) ? value : null));
}

/** The figures of a sparkline's summary, or `null` when it has no values. */
export function getSparklineStats(values: readonly (number | null)[]): SparklineStats | null {
    const finite = values.filter((value): value is number => value !== null);
    if (finite.length === 0) {
        return null;
    }
    return {
        count: finite.length,
        draws: finite.filter(value => value === 0).length,
        first: finite[0],
        last: finite[finite.length - 1],
        losses: finite.filter(value => value < 0).length,
        max: Math.max(...finite),
        min: Math.min(...finite),
        wins: finite.filter(value => value > 0).length
    };
}

export function computeSparklineGeometry(
    values: readonly (number | null)[],
    options: SparklineGeometryOptions
): SparklineGeometry {
    const stats = getSparklineStats(values);
    if (!stats) {
        return EMPTY_GEOMETRY;
    }
    if (options.type === "win-loss") {
        return { ...EMPTY_GEOMETRY, bars: getWinLossBars(values) };
    }
    const domain = getDomain(stats, options);
    const toY = (value: number): number =>
        round(clamp(((domain.high - value) / (domain.high - domain.low)) * 100, 0, 100));
    const zero = clamp(0, domain.low, domain.high);
    const referenceY =
        options.referenceValue != null && Number.isFinite(options.referenceValue) ? toY(options.referenceValue) : null;

    if (options.type === "column") {
        const baselineY = toY(zero);
        return {
            ...EMPTY_GEOMETRY,
            bars: getColumnBars(values, toY, baselineY),
            baselineY: domain.low < 0 && domain.high > 0 ? baselineY : null,
            referenceY
        };
    }

    const toX = (index: number): number => (values.length === 1 ? 50 : round((index / (values.length - 1)) * 100));
    const runs = getRuns(values);
    const point = (index: number): string => `${toX(index)} ${toY(values[index] as number)}`;
    const lines = runs
        .filter(run => run.length > 1)
        .map(run => run.map((index): [number, number] => [toX(index), toY(values[index] as number)]));
    const curve = CURVES[options.curve] ?? curveLinear;
    const drawLine = line().curve(curve).digits(2);
    const linePath = lines.map(points => drawLine(points) ?? "").join("");
    const dotsPath = runs
        .filter(run => run.length === 1)
        .map(run => dot(point(run[0])))
        .join("");
    const drawArea = area().curve(curve).digits(2).y0(toY(zero));
    const areaPath = options.type === "area" ? lines.map(points => drawArea(points) ?? "").join("") : "";
    const markersPath = getMarkedIndices(values, stats, options.markers)
        .map(index => dot(point(index)))
        .join("");
    return { areaPath, bars: [], baselineY: null, dotsPath, linePath, markersPath, referenceY };
}

/**
 * The values at the top and bottom of the drawing. Columns stand on zero, so it's in the range; the reference value is
 * too, to be seen. A range with nothing in it is widened around its value, which then sits in the middle.
 */
function getDomain(stats: SparklineStats, options: SparklineGeometryOptions): Domain {
    const reference =
        options.referenceValue != null && Number.isFinite(options.referenceValue) ? options.referenceValue : null;
    const lows = [stats.min, ...(reference === null ? [] : [reference]), ...(options.type === "column" ? [0] : [])];
    const highs = [stats.max, ...(reference === null ? [] : [reference]), ...(options.type === "column" ? [0] : [])];
    let low = options.min != null && Number.isFinite(options.min) ? options.min : Math.min(...lows);
    let high = options.max != null && Number.isFinite(options.max) ? options.max : Math.max(...highs);
    if (low > high) {
        [low, high] = [high, low];
    }
    if (low === high) {
        return { high: high + 1, low: low - 1 };
    }
    return { high, low };
}

function getColumnBars(
    values: readonly (number | null)[],
    toY: (value: number) => number,
    baselineY: number
): SparklineBar[] {
    const slot = SPARKLINE_VIEW_SIZE / values.length;
    const width = round(slot * BAR_WIDTH_RATIO);
    const bars: SparklineBar[] = [];
    values.forEach((value, index) => {
        if (value === null) {
            return;
        }
        const y = toY(value);
        bars.push({
            height: round(Math.abs(baselineY - y)),
            kind: value < 0 ? "negative" : "positive",
            width,
            x: round(index * slot + (slot - width) / 2),
            y: Math.min(y, baselineY)
        });
    });
    return bars;
}

function getWinLossBars(values: readonly (number | null)[]): SparklineBar[] {
    const slot = SPARKLINE_VIEW_SIZE / values.length;
    const width = round(slot * BAR_WIDTH_RATIO);
    const middle = SPARKLINE_VIEW_SIZE / 2;
    const bars: SparklineBar[] = [];
    values.forEach((value, index) => {
        if (value === null) {
            return;
        }
        const x = round(index * slot + (slot - width) / 2);
        if (value > 0) {
            bars.push({ height: WIN_LOSS_BAR_HEIGHT, kind: "positive", width, x, y: 0 });
        } else if (value < 0) {
            bars.push({
                height: WIN_LOSS_BAR_HEIGHT,
                kind: "negative",
                width,
                x,
                y: SPARKLINE_VIEW_SIZE - WIN_LOSS_BAR_HEIGHT
            });
        } else {
            bars.push({
                height: WIN_LOSS_TICK_HEIGHT,
                kind: "zero",
                width,
                x,
                y: middle - WIN_LOSS_TICK_HEIGHT / 2
            });
        }
    });
    return bars;
}

/** The indices of the marked values, each once: the first occurrence of the lowest and of the highest. */
function getMarkedIndices(
    values: readonly (number | null)[],
    stats: SparklineStats,
    markers: readonly SparklineMarker[]
): number[] {
    const indices = new Set<number>();
    for (const marker of markers) {
        switch (marker) {
            case "first":
                indices.add(values.findIndex(value => value !== null));
                break;
            case "last": {
                let index = values.length - 1;
                while (values[index] === null) {
                    index--;
                }
                indices.add(index);
                break;
            }
            case "max":
                indices.add(values.indexOf(stats.max));
                break;
            case "min":
                indices.add(values.indexOf(stats.min));
                break;
        }
    }
    return Array.from(indices).sort((a, b) => a - b);
}

/** The indices of each run of values without a gap. */
function getRuns(values: readonly (number | null)[]): number[][] {
    const runs: number[][] = [];
    let run: number[] = [];
    values.forEach((value, index) => {
        if (value === null) {
            if (run.length > 0) {
                runs.push(run);
            }
            run = [];
            return;
        }
        run.push(index);
    });
    if (run.length > 0) {
        runs.push(run);
    }
    return runs;
}

/** A dot at a point: a segment of no length, which a round line cap draws as a circle as wide as the stroke. */
function dot(point: string): string {
    return `M${point}h0`;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}
