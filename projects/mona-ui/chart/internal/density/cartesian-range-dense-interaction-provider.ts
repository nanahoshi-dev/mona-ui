import type {} from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import {
    type CartesianDenseInteractionProvider,
    type CartesianDenseMarkIdentityQuery,
    type CartesianDensePointerQuery,
    type CartesianDenseRangeQuery,
    type CartesianDenseSemanticBucketQuery,
    DenseMarkIdentityIndex
} from "./cartesian-dense-interaction-provider";
import type { CartesianRangeDensityData } from "./cartesian-density-preparer";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type {
    ChartRangeAreaSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import { ChartMarkKeyResolver, resolveMarkKeyPart } from "../animation/animation-identity";
import { DenseSegmentGeometryIndex } from "./cartesian-dense-geometry-index";
import type { ChartField } from "../../models/chart.models";
import { normalizeNonNegativeNumber } from "../utils/number-utils";
import { resolveValue } from "../data/chart-value-resolver";
import {
    lowerBoundAscending,
    lowerBoundDescending,
    upperBoundAscending,
    upperBoundDescending
} from "./cartesian-minmax-block-index";
import { normalizeSemanticNumericKey, resolveSemanticNumericRun } from "./cartesian-semantic-key";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { resolveRangeAreaHitGeometry } from "../layout/cartesian-range-hit-geometry";

import type { ChartSeriesMarkIdentityAuthority } from "../animation/chart-series-mark-identity-authority";

export interface CartesianRangeDenseProviderOptions {
    readonly identity?: ChartSeriesMarkIdentityAuthority;
    readonly pointRadius?: number;
    readonly range: CartesianRangeDensityData;
    readonly series: ChartRangeAreaSeriesRegistration;
    readonly seriesDisplayName: string;
    readonly showPoints?: boolean;
    readonly timeSpanMs?: number;
    readonly xAxis?: ChartXAxisRegistration;
    readonly xFormatter?: import("../../models/chart-axis.models").ChartAxisFormatter;
    readonly xAxisId: string;
    readonly xField?: ChartField;
    readonly xScale: ChartContinuousPositionScale<number | Date>;
    readonly yAxis?: ChartYAxisRegistration;
    readonly yFormatter?: import("../../models/chart-axis.models").ChartAxisFormatter;
    readonly yAxisId: string;
    readonly yScale: ChartContinuousPositionScale<number>;
}

export class CartesianRangeAreaDenseInteractionProvider implements CartesianDenseInteractionProvider {
    readonly #options: CartesianRangeDenseProviderOptions;
    readonly #keyResolver: ChartMarkKeyResolver;
    #geometryIndex: DenseSegmentGeometryIndex | null = null;
    #identityIndex: DenseMarkIdentityIndex | null = null;
    public readonly seriesId: string;
    public readonly xAxisId: string;
    public readonly yAxisId: string;

    public constructor(options: CartesianRangeDenseProviderOptions) {
        this.#options = options;
        this.seriesId = options.series.id;
        this.xAxisId = options.xAxisId;
        this.yAxisId = options.yAxisId;
        this.#keyResolver = new ChartMarkKeyResolver(
            options.series.id,
            options.series.keyField?.(),
            options.series.seriesKey?.()
        );
    }

    public locateMarkIdentity(query: CartesianDenseMarkIdentityQuery): number | null {
        if (this.#options.identity) {
            return this.#options.identity.locate(query);
        }
        if (!this.#identityIndex) {
            this.#identityIndex = new DenseMarkIdentityIndex(this.#options.range.sourceData.length, (_d, i) => {
                const rawX = this.#options.range.x[i];
                return resolveMarkKeyPart(this.#options.range.sourceData[i], this.#options.series.keyField?.(), rawX, i)
                    .part;
            });
        }
        return this.#identityIndex.locate(query);
    }

    public materializeAt(sourceIndex: number): SceneHitTarget | null {
        return this.#materialize(sourceIndex);
    }

    public resolveNearest(query: CartesianDensePointerQuery): readonly SceneHitTarget[] {
        const { range, xScale, yScale } = this.#options;
        const n = range.x.length;
        if (n === 0 || range.monotonicity === "unsorted" || range.monotonicity === "unsearchable") {
            if (range.monotonicity === "unsorted" || range.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onBinaryXFallback?.();
            }
            if (range.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onUnsearchableXFallback?.();
            }
            return [];
        }

        if (!this.#geometryIndex) {
            this.#geometryIndex =
                this.#options.range.segmentGeometryIndex ??
                new DenseSegmentGeometryIndex({
                    count: n,
                    getHighY: i => range.to[i],
                    getLowY: i => range.from[i],
                    getX: i => range.x[i],
                    isValid: i => range.segmentIds[i] >= 0
                });
        }

        const dimension = query.dimension ?? "xy";
        const bestIdx = this.#geometryIndex.resolveNearest({
            dimension,
            mapX: x => {
                const px =
                    xScale.type === "time" || xScale.type === "utc"
                        ? (xScale as ChartContinuousPositionScale<Date>).map(new Date(x))
                        : (xScale as ChartContinuousPositionScale<number>).map(x);
                return px !== undefined && Number.isFinite(px) ? px : undefined;
            },
            mapY: y => {
                const py = yScale.map(y);
                return py !== undefined && Number.isFinite(py) ? py : undefined;
            },
            pixel: query.pixel
        });

        if (bestIdx === null || bestIdx < 0) {
            return [];
        }
        const bestTarget = this.#materialize(bestIdx);
        return bestTarget ? [bestTarget] : [];
    }

    public queryRange(query: CartesianDenseRangeQuery): readonly SceneHitTarget[] {
        const { hitPolicy = "intersect", pixelA, pixelB } = query;
        const { range, xScale } = this.#options;
        const n = range.x.length;
        if (n === 0 || range.monotonicity === "unsorted" || range.monotonicity === "unsearchable") {
            if (range.monotonicity === "unsorted" || range.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onBinaryXFallback?.();
            }
            if (range.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onUnsearchableXFallback?.();
            }
            return [];
        }

        const minPxX = Math.min(pixelA.x, pixelB.x);
        const maxPxX = Math.max(pixelA.x, pixelB.x);
        const minPxY = Math.min(pixelA.y, pixelB.y);
        const maxPxY = Math.max(pixelA.y, pixelB.y);

        const inv0 = xScale.invert?.(minPxX);
        const inv1 = xScale.invert?.(maxPxX);
        if (inv0 === undefined || inv1 === undefined) return [];

        const num = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));
        const minX = Math.min(num(inv0), num(inv1));
        const maxX = Math.max(num(inv0), num(inv1));
        ChartDensityTracker.current?.onBinaryXQuery?.();

        const isAscending = range.monotonicity === "ascending" || range.monotonicity === "non-decreasing";
        const isDescending = range.monotonicity === "descending" || range.monotonicity === "non-increasing";
        let startIdx = 0;
        let endIdx = n;
        if (isAscending) {
            startIdx = Math.max(0, lowerBoundAscending(range.x, 0, n, minX) - 1);
            endIdx = Math.min(n, upperBoundAscending(range.x, 0, n, maxX) + 1);
        } else if (isDescending) {
            startIdx = Math.max(0, lowerBoundDescending(range.x, 0, n, maxX) - 1);
            endIdx = Math.min(n, upperBoundDescending(range.x, 0, n, minX) + 1);
        }

        const hits: SceneHitTarget[] = [];
        for (let i = startIdx; i < endIdx; i++) {
            ChartDensityTracker.current?.onDenseRawHitCandidateVisited?.();
            if (range.segmentIds[i] < 0) continue;
            const t = this.#materialize(i);
            if (!t || !t.point) continue;

            const inX = t.point.x >= minPxX - 1e-9 && t.point.x <= maxPxX + 1e-9;
            if (!inX) continue;

            const lowY = t.lowPoint?.y ?? t.point.y;
            const highY = t.highPoint?.y ?? t.point.y;
            const top = Math.min(lowY, highY);
            const bottom = Math.max(lowY, highY);

            if (hitPolicy === "contains") {
                if (top >= minPxY - 1e-9 && bottom <= maxPxY + 1e-9) {
                    hits.push(t);
                }
            } else {
                if (bottom >= minPxY - 1e-9 && top <= maxPxY + 1e-9) {
                    hits.push(t);
                }
            }
        }
        return hits;
    }

    public resolveSemanticBucket(query: CartesianDenseSemanticBucketQuery): readonly SceneHitTarget[] {
        if (query.axis !== "x") {
            return [];
        }
        if (query.axisId && this.xAxisId && query.axisId !== this.xAxisId) {
            return [];
        }
        const { range } = this.#options;
        const n = range.x.length;
        if (n === 0 || range.monotonicity === "unsorted" || range.monotonicity === "unsearchable") {
            if (range.monotonicity === "unsorted" || range.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onBinaryXFallback?.();
            }
            if (range.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onUnsearchableXFallback?.();
            }
            return [];
        }
        ChartDensityTracker.current?.onBinaryXQuery?.();
        const key = query.key;
        const semanticX = normalizeSemanticNumericKey(key);
        if (semanticX === null) {
            return [];
        }
        const match = resolveSemanticNumericRun(range.x, range.monotonicity, semanticX);
        if (!match) {
            return [];
        }
        const matches: SceneHitTarget[] = [];
        for (let i = match.startIndex; i < match.endIndexExclusive; i++) {
            if (range.segmentIds[i] >= 0) {
                const target = this.#materialize(i);
                if (target) {
                    matches.push(target);
                }
            }
        }
        return matches;
    }

    #materialize(index: number): SceneHitTarget | null {
        const {
            range,
            series,
            seriesDisplayName,
            timeSpanMs,
            xAxis,
            xAxisId,
            xFormatter,
            xScale,
            yAxis,
            yAxisId,
            yFormatter,
            yScale
        } = this.#options;
        if (index < 0 || index >= range.sourceData.length || range.segmentIds[index] < 0) {
            return null;
        }

        const datum = range.sourceData[index];
        const rawFrom = range.from[index];
        const rawTo = range.to[index];
        const rawX = range.x[index];
        if (!Number.isFinite(rawFrom) || !Number.isFinite(rawTo) || !Number.isFinite(rawX)) {
            return null;
        }

        const fromY = yScale.map(rawFrom);
        const toY = yScale.map(rawTo);
        if (fromY === undefined || toY === undefined || !Number.isFinite(fromY) || !Number.isFinite(toY)) {
            return null;
        }

        let mappedX: number | undefined;
        if (xScale.type === "time" || xScale.type === "utc") {
            mappedX = (xScale as ChartContinuousPositionScale<Date>).map(new Date(rawX));
        } else {
            mappedX = (xScale as ChartContinuousPositionScale<number>).map(rawX);
        }
        if (mappedX === undefined || !Number.isFinite(mappedX)) {
            return null;
        }
        const xPos = mappedX;

        const lowY = Math.max(fromY, toY);
        const highY = Math.min(fromY, toY);
        const lowVal = Math.min(rawFrom, rawTo);
        const highVal = Math.max(rawFrom, rawTo);
        const lowPoint = { x: xPos, y: lowY };
        const highPoint = { x: xPos, y: highY };

        const seriesRawFormatter = series.valueFormatter?.();
        const effectiveRawFormatter = seriesRawFormatter ?? yFormatter;
        const formattedFrom = formatYValue(rawFrom, index, effectiveRawFormatter);
        const formattedTo = formatYValue(rawTo, index, effectiveRawFormatter);
        const formattedValue = `${formattedFrom} \u2013 ${formattedTo}`;

        const animationKey = this.#options.identity
            ? this.#options.identity.resolveKeyAt(index, rawX, datum)
            : this.#keyResolver.resolveKey(datum, rawX, index);

        const effectiveXField = this.#options.xField ?? series.xField?.();
        const rawSourceX = resolveValue(datum, effectiveXField, index);
        const xValue =
            rawSourceX !== undefined
                ? rawSourceX
                : xScale.type === "time" || xScale.type === "utc"
                  ? new Date(rawX)
                  : rawX;

        const formattedCategory = formatXValue(rawX, index, xFormatter, xScale.type as never, timeSpanMs);

        const pointRadius = normalizeNonNegativeNumber(this.#options.pointRadius, 4);
        const hitGeometry = resolveRangeAreaHitGeometry(this.#options.showPoints === true, pointRadius);

        return {
            animationKey,
            datum,
            formattedCategory,
            formattedFrom,
            formattedTo,
            formattedValue,
            fromValue: rawFrom,
            highPoint,
            highValue: highVal,
            index,
            lowPoint,
            lowValue: lowVal,
            point: { x: xPos, y: (fromY + toY) / 2 },
            radius: hitGeometry.hitRadius,
            range: {
                formattedFrom,
                formattedTo,
                fromValue: rawFrom,
                highValue: highVal,
                lowValue: lowVal,
                toValue: rawTo
            },
            rangeBand: {
                fromPoint: { x: xPos, y: fromY },
                toPoint: { x: xPos, y: toY }
            },
            seriesId: series.id,
            seriesName: seriesDisplayName,
            seriesType: "rangeArea",
            toValue: rawTo,
            value: [rawFrom, rawTo],
            valueKind: "range",
            visualRadius: hitGeometry.visualRadius,
            xAxisId,
            xAxisTitle: xAxis?.title?.() ?? "",
            xKey: rawX,
            xValue,
            yAxisId,
            yAxisTitle: yAxis?.title?.() ?? ""
        } as SceneHitTarget;
    }
}
