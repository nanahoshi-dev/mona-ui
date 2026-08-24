import type {} from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import {
    type CartesianDenseInteractionProvider,
    type CartesianDenseMarkIdentityQuery,
    type CartesianDensePointerQuery,
    type CartesianDenseRangeQuery,
    type CartesianDenseSemanticBucketQuery
} from "./cartesian-dense-interaction-provider";
import { resolveCanonicalTimelineKey, type CartesianStackGroupDensityRuntime } from "./cartesian-stack-density-runtime";
import type { CartesianStackEntry } from "../data/cartesian-stack-engine";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { ChartAxisFormatter } from "../../models/chart-axis.models";
import type {
    ChartAreaSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { lowerBoundAscending, upperBoundAscending } from "./cartesian-minmax-block-index";
import { DenseSegmentGeometryIndex } from "./cartesian-dense-geometry-index";
import { materializeStackedAreaHitTarget, resolveStackEntryXCoordinate } from "./cartesian-stack-geometry-resolver";
import { normalizeSemanticNumericKey } from "./cartesian-semantic-key";

export interface CartesianStackedAreaDenseProviderOptions {
    readonly groupRuntime: CartesianStackGroupDensityRuntime;
    readonly pointRadius?: number;
    readonly series: ChartAreaSeriesRegistration;
    readonly seriesDisplayName: string;
    readonly showPoints?: boolean;
    readonly timeSpanMs?: number;
    readonly xFormatter?: ChartAxisFormatter;
    readonly xAxis?: ChartXAxisRegistration;
    readonly xAxisId: string;
    readonly xScale: ChartContinuousPositionScale<number | Date>;
    readonly yFormatter?: ChartAxisFormatter;
    readonly yAxis?: ChartYAxisRegistration;
    readonly yAxisId: string;
    readonly yScale: ChartContinuousPositionScale<number>;
}

export class CartesianStackedAreaDenseInteractionProvider implements CartesianDenseInteractionProvider {
    readonly #options: CartesianStackedAreaDenseProviderOptions;
    #geometryIndex: DenseSegmentGeometryIndex | null = null;
    #indexedEntries: readonly CartesianStackEntry[] | null = null;
    public readonly seriesId: string;
    public readonly xAxisId: string;
    public readonly yAxisId: string;

    public constructor(options: CartesianStackedAreaDenseProviderOptions) {
        this.#options = options;
        this.seriesId = options.series.id;
        this.xAxisId = options.xAxisId;
        this.yAxisId = options.yAxisId;
    }

    public locateMarkIdentity(query: CartesianDenseMarkIdentityQuery): number | null {
        return this.#options.groupRuntime.membersBySeriesId.get(this.seriesId)?.identity.get().locate(query) ?? null;
    }

    public materializeAt(sourceIndex: number): SceneHitTarget | null {
        const { groupRuntime, series } = this.#options;
        const entry = groupRuntime.entriesBySeriesAndIndex.get(series.id)?.get(sourceIndex);
        if (!entry) {
            return null;
        }
        return this.#materializeEntry(entry);
    }

    public resolveNearest(query: CartesianDensePointerQuery): readonly SceneHitTarget[] {
        const { groupRuntime, series, xScale, yScale } = this.#options;
        const member = groupRuntime.membersBySeriesId.get(series.id);
        if (member) {
            this.#geometryIndex = member.segmentGeometryIndex;
            this.#indexedEntries = member.entries;
        } else {
            const entries = groupRuntime.entriesBySeriesAndIndex.get(series.id);
            const list = entries ? Array.from(entries.values()).filter(e => !e.synthetic && e.dataIndex >= 0) : [];
            if (list.length === 0) return [];

            if (!this.#geometryIndex) {
                this.#geometryIndex = new DenseSegmentGeometryIndex({
                    count: list.length,
                    getHighY: i => list[i].stackEnd,
                    getLowY: i => list[i].stackStart,
                    getX: i => {
                        const entry = list[i];
                        return typeof entry.xKey === "number" && Number.isFinite(entry.xKey)
                            ? entry.xKey
                            : entry.xValue instanceof Date
                              ? entry.xValue.getTime()
                              : Number(entry.xValue ?? entry.xKey);
                    },
                    isValid: i => list[i].defined && !list[i].synthetic && list[i].dataIndex >= 0
                });
                this.#indexedEntries = list;
            }
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

        if (bestIdx === null || bestIdx < 0 || !this.#indexedEntries) {
            return [];
        }
        const bestEntry = this.#indexedEntries[bestIdx];
        const target = this.#materializeEntry(bestEntry);
        return target ? [target] : [];
    }

    public resolveSemanticBucket(query: CartesianDenseSemanticBucketQuery): readonly SceneHitTarget[] {
        if (query.axis !== "x") {
            return [];
        }
        if (query.axisId && this.xAxisId && query.axisId !== this.xAxisId) {
            return [];
        }
        const { groupRuntime, series } = this.#options;
        const keyMap = groupRuntime.entriesBySeriesAndKey.get(series.id);
        if (!keyMap) {
            return [];
        }
        let entry = keyMap.get(query.key as never);
        if (!entry) {
            const numKey = normalizeSemanticNumericKey(query.key);
            if (numKey !== null && this.#options.xScale.type !== "category") {
                const canonicalKey = resolveCanonicalTimelineKey(groupRuntime.timeline, numKey);
                if (canonicalKey !== null) {
                    entry = keyMap.get(canonicalKey);
                }
            }
        }

        if (!entry || entry.synthetic || entry.dataIndex < 0 || !entry.defined) {
            return [];
        }
        const t = this.#materializeEntry(entry);
        return t ? [t] : [];
    }

    public queryRange(query: CartesianDenseRangeQuery): readonly SceneHitTarget[] {
        const { hitPolicy = "intersect", pixelA, pixelB } = query;
        const { groupRuntime, series, xScale, yScale } = this.#options;
        const timeline = groupRuntime.timeline;
        const n = timeline.xNumeric.length;
        if (n === 0) return [];

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

        const startIdx = Math.max(0, lowerBoundAscending(timeline.xNumeric, 0, n, minX) - 1);
        const endIdx = Math.min(n, upperBoundAscending(timeline.xNumeric, 0, n, maxX) + 1);

        const hits: SceneHitTarget[] = [];
        for (let i = startIdx; i < endIdx; i++) {
            const xNum = timeline.xNumeric[i];
            if (xNum < minX || xNum > maxX) continue;
            const xKey = timeline.xKeys[i];
            const entry = groupRuntime.entriesBySeriesAndKey.get(series.id)?.get(xKey);
            if (!entry || !entry.defined || entry.synthetic || entry.dataIndex < 0) continue;
            const t = this.#materializeEntry(entry);
            if (!t || !t.point) continue;

            const inX = t.point.x >= minPxX && t.point.x <= maxPxX;
            if (!inX) continue;

            const topY = t.point.y;
            const baseY = yScale.map(entry.stackStart) ?? topY;
            const top = Math.min(topY, baseY);
            const bottom = Math.max(topY, baseY);

            if (hitPolicy === "contains") {
                if (top >= minPxY && bottom <= maxPxY) {
                    hits.push(t);
                }
            } else {
                if (bottom >= minPxY && top <= maxPxY) {
                    hits.push(t);
                }
            }
        }
        return hits;
    }

    #materializeEntry(entry: CartesianStackEntry): SceneHitTarget | null {
        if (entry.synthetic || entry.dataIndex < 0) {
            return null;
        }
        const {
            pointRadius,
            series,
            seriesDisplayName,
            showPoints,
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
        const rawY = yScale.map(entry.stackEnd);
        if (rawY === undefined) return null;

        const xPos = resolveStackEntryXCoordinate(entry, xScale);
        const baseY = yScale.map(entry.stackStart) ?? rawY;

        return materializeStackedAreaHitTarget({
            baseY,
            entry,
            isDense: true,
            pointRadius,
            series,
            seriesDisplayName,
            showPoints,
            stackGroup: this.#options.groupRuntime.group.name,
            timeSpanMs,
            topY: rawY,
            x: xPos,
            xFormatter,
            xAxis,
            xAxisId,
            xScaleType: xScale.type,
            yFormatter,
            yAxis,
            yAxisId
        });
    }
}
