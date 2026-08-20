import type { ChartPoint } from "../../models/chart.models";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";

export interface ResolvedCartesianMarkSemantics {
    readonly semanticIndexX: number;
    readonly semanticIndexY: number;
    readonly semanticX: unknown;
    readonly semanticY: unknown;
}

export interface ResolvedCartesianScalarAxes {
    readonly formattedX?: string;
    readonly formattedY?: string;
    readonly xValue?: unknown;
    readonly yValue?: unknown;
}

export class CartesianMarkSemanticResolver {
    public static resolveScalarAxes(
        hit: SceneHitTarget,
        scene?: CartesianXYChartScene | null
    ): ResolvedCartesianScalarAxes {
        const isHorizontal = hit.barOrientation === "horizontal" || scene?.orientation === "horizontal";
        const isRange =
            hit.seriesType === "rangeBar" ||
            hit.seriesType === "rangeArea" ||
            hit.valueKind === "range" ||
            hit.range !== undefined;

        let xValue: unknown;
        let yValue: unknown;

        if (hit.financial || hit.seriesType === "candlestick" || hit.seriesType === "ohlc") {
            const close = hit.close ?? hit.financial?.close ?? hit.yValue ?? hit.value;
            if (isHorizontal) {
                xValue = close;
                yValue = hit.category ?? hit.categoryY ?? hit.yCategory ?? hit.xValue;
            } else {
                xValue = hit.category ?? hit.categoryX ?? hit.xValue;
                yValue = close;
            }
        } else if (isRange) {
            if (isHorizontal) {
                xValue = undefined;
                yValue = hit.category ?? hit.categoryY ?? hit.yCategory ?? hit.yValue ?? hit.xValue;
            } else {
                xValue = hit.category ?? hit.categoryX ?? hit.xValue;
                yValue = undefined;
            }
        } else if (hit.seriesType === "bar" || hit.seriesType === "area") {
            if (isHorizontal) {
                xValue = hit.stackEnd ?? hit.xValue ?? hit.value ?? hit.rawValue ?? hit.yValue;
                yValue = hit.category ?? hit.categoryY ?? hit.yCategory ?? hit.yValue ?? hit.xValue;
            } else {
                xValue = hit.category ?? hit.categoryX ?? hit.xValue;
                yValue = hit.stackEnd ?? hit.yValue ?? hit.value ?? hit.rawValue;
            }
        } else {
            // Line, scatter, bubble, etc.
            if (isHorizontal) {
                xValue = hit.xValue ?? hit.value ?? hit.rawValue;
                yValue = hit.category ?? hit.categoryY ?? hit.yCategory ?? hit.yValue;
            } else {
                xValue = hit.xValue ?? hit.category ?? hit.categoryX;
                yValue = hit.yValue ?? hit.value ?? hit.rawValue;
            }
        }

        let formattedX: string | undefined;
        let formattedY: string | undefined;

        if (isHorizontal) {
            formattedX =
                hit.formattedXValue ??
                (isRange ? undefined : hit.formattedValue) ??
                (xValue !== undefined && xValue !== null ? String(xValue) : undefined);
            formattedY =
                hit.formattedYCategory ??
                hit.formattedCategory ??
                hit.formattedValue ??
                (yValue !== undefined && yValue !== null ? String(yValue) : undefined);
        } else {
            formattedX =
                hit.formattedXValue ??
                hit.formattedCategory ??
                (xValue !== undefined && xValue !== null ? String(xValue) : undefined);
            formattedY =
                (isRange ? undefined : hit.formattedValue) ??
                (yValue !== undefined && yValue !== null ? String(yValue) : undefined);
        }

        return {
            formattedX,
            formattedY,
            xValue,
            yValue
        };
    }

    public static resolve(
        hit: SceneHitTarget,
        scene: CartesianXYChartScene,
        pointer: ChartPoint,
        targetXAxisId?: string,
        targetYAxisId?: string
    ): ResolvedCartesianMarkSemantics {
        const isHorizontal = hit.barOrientation === "horizontal" || scene.orientation === "horizontal";
        const dataIndex = hit.index ?? hit.dataIndex ?? 0;
        const coordinateSpace = scene.coordinateSpace;

        // 1. Financial series (Candlestick, OHLC)
        if (hit.financial || hit.seriesType === "candlestick" || hit.seriesType === "ohlc") {
            const finClose = hit.close ?? hit.financial?.close ?? hit.yValue;
            const markX = hit.xValue ?? hit.category ?? hit.categoryX;
            return {
                semanticIndexX: dataIndex,
                semanticIndexY: dataIndex,
                semanticX: markX,
                semanticY: finClose
            };
        }

        // 2. Range series (RangeBar, RangeArea)
        if (
            hit.seriesType === "rangeBar" ||
            hit.seriesType === "rangeArea" ||
            hit.valueKind === "range" ||
            hit.range !== undefined
        ) {
            const fromVal = hit.fromValue ?? hit.range?.fromValue ?? 0;
            const toVal = hit.toValue ?? hit.range?.toValue ?? 0;

            if (isHorizontal) {
                // Horizontal range: value axis is X, category axis is Y
                const effXId = targetXAxisId ?? hit.xAxisId ?? scene.primaryXAxisId;
                const xRef = effXId ? { axis: "x" as const, axisId: effXId } : null;

                let chosenX: unknown = fromVal;
                if (coordinateSpace && xRef) {
                    const fromPx = coordinateSpace.mapContinuousValue(xRef, fromVal, "viewport");
                    const toPx = coordinateSpace.mapContinuousValue(xRef, toVal, "viewport");
                    if (
                        fromPx !== undefined &&
                        toPx !== undefined &&
                        Number.isFinite(fromPx) &&
                        Number.isFinite(toPx)
                    ) {
                        chosenX = Math.abs(pointer.x - fromPx) <= Math.abs(pointer.x - toPx) ? fromVal : toVal;
                    } else if (hit.point && hit.highPoint) {
                        chosenX =
                            Math.abs(pointer.x - hit.point.x) <= Math.abs(pointer.x - hit.highPoint.x)
                                ? fromVal
                                : toVal;
                    }
                } else if (hit.point && hit.highPoint) {
                    chosenX =
                        Math.abs(pointer.x - hit.point.x) <= Math.abs(pointer.x - hit.highPoint.x)
                            ? fromVal
                            : toVal;
                }

                const catY = hit.yCategory ?? hit.categoryY ?? hit.category ?? hit.xValue;
                return {
                    semanticIndexX: dataIndex,
                    semanticIndexY: dataIndex,
                    semanticX: chosenX,
                    semanticY: catY
                };
            } else {
                // Vertical range: category axis is X, value axis is Y
                const effYId = targetYAxisId ?? hit.yAxisId ?? scene.primaryYAxisId;
                const yRef = effYId ? { axis: "y" as const, axisId: effYId } : null;

                let chosenY: unknown = fromVal;
                if (coordinateSpace && yRef) {
                    const fromPx = coordinateSpace.mapContinuousValue(yRef, fromVal, "viewport");
                    const toPx = coordinateSpace.mapContinuousValue(yRef, toVal, "viewport");
                    if (
                        fromPx !== undefined &&
                        toPx !== undefined &&
                        Number.isFinite(fromPx) &&
                        Number.isFinite(toPx)
                    ) {
                        chosenY = Math.abs(pointer.y - fromPx) <= Math.abs(pointer.y - toPx) ? fromVal : toVal;
                    } else if (hit.point && (hit.highPoint || hit.lowPoint)) {
                        const yFrom = hit.point.y;
                        const yTo = hit.highPoint?.y ?? hit.lowPoint?.y ?? yFrom;
                        chosenY = Math.abs(pointer.y - yFrom) <= Math.abs(pointer.y - yTo) ? fromVal : toVal;
                    }
                } else if (hit.point && (hit.highPoint || hit.lowPoint)) {
                    const yFrom = hit.point.y;
                    const yTo = hit.highPoint?.y ?? hit.lowPoint?.y ?? yFrom;
                    chosenY = Math.abs(pointer.y - yFrom) <= Math.abs(pointer.y - yTo) ? fromVal : toVal;
                }

                const catX = hit.category ?? hit.categoryX ?? hit.xValue;
                return {
                    semanticIndexX: dataIndex,
                    semanticIndexY: dataIndex,
                    semanticX: catX,
                    semanticY: chosenY
                };
            }
        }

        // 3. Bar series (Stacked or Scalar)
        if (hit.seriesType === "bar") {
            if (isHorizontal) {
                // Horizontal bar: X is numeric value (or stackEnd), Y is category
                const valX = hit.stackEnd ?? hit.value ?? hit.rawValue ?? hit.yValue;
                const catY = hit.yCategory ?? hit.categoryY ?? hit.category ?? hit.xValue;
                return {
                    semanticIndexX: dataIndex,
                    semanticIndexY: dataIndex,
                    semanticX: valX,
                    semanticY: catY
                };
            } else {
                // Vertical bar: X is category, Y is numeric value (or stackEnd)
                const catX = hit.category ?? hit.categoryX ?? hit.xValue;
                const valY = hit.stackEnd ?? hit.yValue ?? hit.value;
                return {
                    semanticIndexX: dataIndex,
                    semanticIndexY: dataIndex,
                    semanticX: catX,
                    semanticY: valY
                };
            }
        }

        // 4. Area series (Stacked or regular)
        if (hit.seriesType === "area") {
            if (isHorizontal) {
                const markX = hit.stackEnd ?? hit.value ?? hit.rawValue ?? hit.xValue;
                const markY = hit.yCategory ?? hit.categoryY ?? hit.category ?? hit.yValue;
                return {
                    semanticIndexX: dataIndex,
                    semanticIndexY: dataIndex,
                    semanticX: markX,
                    semanticY: markY
                };
            } else {
                const markX = hit.xValue ?? hit.category ?? hit.categoryX;
                const markY = hit.stackEnd ?? hit.yValue ?? hit.value;
                return {
                    semanticIndexX: dataIndex,
                    semanticIndexY: dataIndex,
                    semanticX: markX,
                    semanticY: markY
                };
            }
        }

        // 5. Point-like marks (Line, Scatter, Bubble)
        if (isHorizontal) {
            return {
                semanticIndexX: dataIndex,
                semanticIndexY: dataIndex,
                semanticX: hit.xValue ?? hit.value ?? hit.rawValue,
                semanticY: hit.yCategory ?? hit.categoryY ?? hit.category ?? hit.yValue
            };
        }

        return {
            semanticIndexX: dataIndex,
            semanticIndexY: dataIndex,
            semanticX: hit.xValue ?? hit.category ?? hit.categoryX,
            semanticY: hit.yValue ?? hit.value
        };
    }
}
