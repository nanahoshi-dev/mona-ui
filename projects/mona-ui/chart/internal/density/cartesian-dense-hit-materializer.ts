import type { ChartField, ChartPoint } from "../../models/chart.models";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { ChartMarkKeyResolver } from "../animation/animation-identity";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import type { CartesianScalarDensityData } from "./cartesian-density-preparer";

export interface DenseHitMaterializerContext {
    readonly keyResolver: ChartMarkKeyResolver;
    readonly scalar: CartesianScalarDensityData;
    readonly seriesDisplayName: string;
    readonly seriesId: string;
    readonly seriesType: "area" | "line";
    readonly temporal: boolean;
    readonly valueFormatter?: (value: unknown, index: number) => string;
    readonly xAxisFormatter?: (value: unknown, index: number) => string;
    readonly xAxisId: string;
    readonly xAxisTitle?: string;
    readonly xScale: ChartContinuousPositionScale<number | Date>;
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

        const xPos = context.xScale.map(context.temporal ? new Date(xNum) : xNum);
        const yPos = context.yScale.map(yNum);
        if (xPos === undefined || yPos === undefined || !Number.isFinite(xPos) || !Number.isFinite(yPos)) {
            return null;
        }

        // Public values preserve original temporal semantics.
        const xValue: unknown = context.temporal ? new Date(xNum) : xNum;

        // Duplicate occurrence rank within equal-X runs, matching what the full
        // sequential layout would assign (stable mark identity across
        // repeated raw materializations).
        let occurrenceRank = 0;
        for (let j = sourceIndex - 1; j >= 0; j--) {
            if (scalar.x[j] === xNum) {
                occurrenceRank++;
            } else {
                break;
            }
        }
        const animationKey = context.keyResolver.resolveKeyWithRank(datum, xNum, sourceIndex, occurrenceRank);
        const point: ChartPoint = { x: xPos, y: yPos };

        return {
            animationKey,
            datum,
            formattedCategory: formatXValue(
                xNum,
                sourceIndex,
                context.xAxisFormatter,
                context.temporal ? "time" : "linear"
            ),
            formattedValue: formatYValue(yNum, sourceIndex, context.yAxisFormatter ?? context.valueFormatter),
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
