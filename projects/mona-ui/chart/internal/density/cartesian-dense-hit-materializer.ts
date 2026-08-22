import type { ChartField, ChartPoint } from "../../models/chart.models";
import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { ChartMarkKeyResolver } from "../animation/animation-identity";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import { resolveValue } from "../data/chart-value-resolver";
import type { CartesianScalarDensityData } from "./cartesian-density-preparer";

import type { ChartSeriesMarkIdentityAuthority } from "../animation/chart-series-mark-identity-authority";

export interface DenseHitMaterializerContext {
    readonly identity?: ChartSeriesMarkIdentityAuthority;
    readonly keyResolver?: ChartMarkKeyResolver;
    readonly scalar: CartesianScalarDensityData;
    readonly seriesDisplayName: string;
    readonly seriesId: string;
    readonly seriesType: "area" | "line";
    readonly valueFormatter?: (value: unknown, index: number) => string;
    readonly xAxisFormatter?: (value: unknown, index: number) => string;
    readonly xAxisId: string;
    readonly xAxisTitle?: string;
    readonly xAxisType: ChartXAxisType;
    readonly xField?: ChartField;
    readonly xScale: ChartContinuousPositionScale<number | Date>;
    readonly xTimeSpanMs?: number;
    readonly yAxisFormatter?: (value: unknown, index: number) => string;
    readonly yAxisId: string;
    readonly yAxisTitle?: string;
    readonly yScale: ChartContinuousPositionScale<number | Date>;
}

/**
 * Materializes a full SceneHitTarget for a single raw source datum (§62).
 * Formatter/accessor work happens only after candidate narrowing, never per
 * raw point per frame (§154).
 */
export function createDenseHitMaterializer(context: DenseHitMaterializerContext) {
    return (sourceIndex: number): SceneHitTarget | null => {
        const { scalar } = context;
        const datum = scalar.sourceData[sourceIndex];
        if (datum === undefined) {
            return null;
        }
        const xNum = scalar.x[sourceIndex];
        const yNum = scalar.y[sourceIndex];
        if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) {
            return null;
        }

        const isTemporal = context.xAxisType === "time" || context.xAxisType === "utc";
        const xPos = context.xScale.map(isTemporal ? new Date(xNum) : xNum);
        const yPos = context.yScale.map(yNum);
        if (xPos === undefined || yPos === undefined || !Number.isFinite(xPos) || !Number.isFinite(yPos)) {
            return null;
        }

        // Public values preserve original source semantics.
        let xValue: unknown = undefined;
        if (context.xField !== undefined) {
            xValue = resolveValue(datum, context.xField, sourceIndex);
        } else if (typeof datum === "object" && datum !== null && "x" in datum) {
            xValue = (datum as { x: unknown }).x;
        }
        if (xValue === undefined) {
            xValue = isTemporal ? new Date(xNum) : xNum;
        }

        const animationKey = context.identity
            ? context.identity.resolveKeyAt(sourceIndex, xNum, datum)
            : (context.keyResolver?.resolveKey(datum, xNum, sourceIndex) ?? "");
        const point: ChartPoint = { x: xPos, y: yPos };

        return {
            animationKey,
            datum,
            formattedCategory: formatXValue(
                xNum,
                sourceIndex,
                context.xAxisFormatter,
                context.xAxisType,
                context.xTimeSpanMs
            ),
            formattedValue: formatYValue(yNum, sourceIndex, context.valueFormatter ?? context.yAxisFormatter),
            index: sourceIndex,
            point,
            radius: 16,
            seriesId: context.seriesId,
            seriesName: context.seriesDisplayName,
            seriesType: context.seriesType,
            visualRadius: 0,
            xAxisId: context.xAxisId,
            xAxisTitle: context.xAxisTitle,
            xKey: xNum,
            xValue,
            yAxisId: context.yAxisId,
            yAxisTitle: context.yAxisTitle,
            yValue: yNum
        } as SceneHitTarget;
    };
}

export type DenseHitMaterializer = (sourceIndex: number) => SceneHitTarget | null;
export type { ChartField };
