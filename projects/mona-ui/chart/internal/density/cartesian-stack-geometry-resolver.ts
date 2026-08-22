import type { ChartPositionScale, ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { BandScale, LinearScale, TimeScale, UtcScale } from "../scale/cartesian-scale-factory";
import type { CartesianStackEntry } from "../data/cartesian-stack-engine";
import type { SceneHitTarget, SceneRangeBandGeometry } from "../scene/scene-geometry";
import type {
    ChartAreaSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import { formatPercentagePoint, formatXValue, formatYValue } from "../utils/chart-formatter";
import { formatCompactNumber, normalizeNonNegativeNumber } from "../utils/number-utils";
import { composeMarkKey } from "../animation/animation-identity";
import type { CartesianDenseMarkIdentityQuery } from "./cartesian-dense-interaction-provider";

export function resolveStackEntryXCoordinate(
    entry: CartesianStackEntry,
    xScale: ChartPositionScale<unknown>,
    fallbackX = 0
): number {
    switch (xScale.type) {
        case "category": {
            const bPos = (xScale as BandScale<string>).map(String(entry.xKey));
            if (bPos !== undefined && Number.isFinite(bPos)) {
                return bPos + (xScale as BandScale<string>).bandwidth() / 2;
            }
            return fallbackX;
        }
        case "time":
        case "utc": {
            const numKey = typeof entry.xKey === "number" ? entry.xKey : Number(entry.xKey);
            const dateVal = Number.isFinite(numKey)
                ? new Date(numKey)
                : entry.xValue instanceof Date
                  ? entry.xValue
                  : new Date(Number(entry.xValue));
            const tPos = (xScale as TimeScale | UtcScale).map(dateVal);
            return tPos !== undefined && Number.isFinite(tPos) ? tPos : fallbackX;
        }
        default: {
            const numKey = typeof entry.xKey === "number" ? entry.xKey : Number(entry.xKey);
            const lPos = (xScale as LinearScale).map(Number.isFinite(numKey) ? numKey : Number(entry.xValue));
            return lPos !== undefined && Number.isFinite(lPos) ? lPos : fallbackX;
        }
    }
}

export interface MaterializeStackedAreaHitTargetContext {
    readonly baseY: number;
    readonly entry: CartesianStackEntry;
    readonly isDense?: boolean;
    readonly pointRadius?: number;
    readonly renderOrder?: number;
    readonly series: ChartAreaSeriesRegistration;
    readonly seriesDisplayName: string;
    readonly showPoints?: boolean;
    readonly stackGroup?: string;
    readonly timeSpanMs?: number;
    readonly topY: number;
    readonly x: number;
    readonly xFormatter?: ChartAxisFormatter;
    readonly xAxis?: ChartXAxisRegistration;
    readonly xAxisId?: string;
    readonly xAxisTitle?: string;
    readonly xScaleType?: ResolvedChartCartesianAxisType | string;
    readonly yFormatter?: ChartAxisFormatter;
    readonly yAxis?: ChartYAxisRegistration;
    readonly yAxisId?: string;
    readonly yAxisTitle?: string;
}

export function materializeStackedAreaHitTarget(
    context: MaterializeStackedAreaHitTargetContext
): SceneHitTarget | null {
    const { baseY, entry, series, seriesDisplayName, topY, x } = context;
    if (entry.synthetic || entry.dataIndex < 0) {
        return null;
    }

    const seriesRawFormatter = series.valueFormatter?.();
    const isPercent = entry.stackPercentage !== undefined;
    const effectiveRawFormatter = seriesRawFormatter ?? (isPercent ? undefined : context.yFormatter);

    const formattedValue = formatYValue(entry.rawValue, entry.dataIndex, effectiveRawFormatter);
    const formattedStackTotal =
        entry.stackTotal !== undefined
            ? seriesRawFormatter
                ? formatYValue(entry.stackTotal, entry.dataIndex, seriesRawFormatter)
                : formatCompactNumber(entry.stackTotal)
            : undefined;

    const formattedStackPercentage =
        entry.stackPercentage !== undefined ? formatPercentagePoint(entry.stackPercentage) : undefined;

    const formattedCategory = formatXValue(
        entry.xKey,
        entry.dataIndex,
        context.xFormatter,
        context.xScaleType as ChartXAxisType,
        context.timeSpanMs
    );

    const visualRadius = context.showPoints ? normalizeNonNegativeNumber(context.pointRadius ?? 4, 4) : 0;
    const hitRadius = Math.max(visualRadius, 16);

    const rangeBand: SceneRangeBandGeometry = {
        fromPoint: { x, y: baseY },
        toPoint: { x, y: topY }
    };

    const xAxisTitle =
        context.xAxisTitle ??
        (typeof context.xAxis?.title === "function" ? context.xAxis.title() : context.xAxis?.title);
    const yAxisTitle =
        context.yAxisTitle ??
        (typeof context.yAxis?.title === "function" ? context.yAxis.title() : context.yAxis?.title);

    const effectiveStackGroup =
        context.stackGroup ??
        (typeof (series as { stack?: unknown }).stack === "function"
            ? (series as { stack: () => string | undefined }).stack()
            : (series as unknown as { stack?: string }).stack);

    return {
        animationKey: entry.animationKey,
        baseY,
        datum: entry.datum,
        defined: entry.defined,
        dimension: "y",
        formattedCategory,
        formattedStackPercentage,
        formattedStackTotal,
        formattedValue,
        index: entry.dataIndex,
        percentage: entry.stackPercentage,
        point: { x, y: topY },
        radius: hitRadius,
        rangeBand,
        rawValue: entry.rawValue,
        renderOrder: context.renderOrder,
        seriesId: series.id,
        seriesName: seriesDisplayName,
        seriesType: "area",
        stackEnd: entry.stackEnd,
        stackGroup: effectiveStackGroup,
        stackMode: isPercent ? "percent" : "normal",
        stackPercentage: entry.stackPercentage,
        stackStart: entry.stackStart,
        stackTotal: entry.stackTotal,
        value: entry.rawValue,
        visualRadius,
        xAxisId:
            context.xAxisId ??
            (typeof (series as { xAxisId?: unknown }).xAxisId === "function"
                ? (series as { xAxisId: () => string | undefined }).xAxisId()
                : undefined) ??
            "default-x",
        xAxisTitle: xAxisTitle ?? "",
        xKey: entry.xKey,
        xValue: entry.xValue,
        yAxisId:
            context.yAxisId ??
            (typeof (series as { yAxisId?: unknown }).yAxisId === "function"
                ? (series as { yAxisId: () => string | undefined }).yAxisId()
                : undefined) ??
            "default-y",
        yAxisTitle: yAxisTitle ?? "",
        yValue: entry.rawValue
    } as SceneHitTarget;
}

export class CartesianStackCanonicalIdentityIndex {
    readonly #sourceByMarkId = new Map<string, number>();

    public constructor(entries: Iterable<CartesianStackEntry>) {
        for (const entry of entries) {
            if (entry.synthetic || entry.dataIndex < 0) {
                continue;
            }
            this.#sourceByMarkId.set(entry.animationKey, entry.dataIndex);
        }
    }

    public locate(query: CartesianDenseMarkIdentityQuery): number | null {
        const markId = composeMarkKey(
            query.seriesPrefix,
            { type: query.partType, value: query.value },
            query.occurrenceRank
        );
        return this.#sourceByMarkId.get(markId) ?? null;
    }
}
