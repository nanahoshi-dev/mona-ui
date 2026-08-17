import { formatRgb, interpolate, parse, type Color } from "culori";
import type { ChartHeatmapSeriesScene, SceneHeatmapCell } from "../../../models/chart-heatmap.models";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";

interface HeatmapCellMarkState {
    readonly animationKey: string;
    readonly backgroundColor: string;
    readonly borderColor?: string;
    readonly borderRadius: number;
    readonly borderWidth: number;
    readonly categoryX: string;
    readonly categoryY: string;
    readonly datum: unknown;
    readonly formattedValue: string;
    readonly formattedX: string;
    readonly formattedY: string;
    readonly hasValue: boolean;
    readonly height: number;
    readonly labelColor?: string;
    readonly numericValue: number | null;
    readonly opacity: number;
    readonly rawValue: unknown;
    readonly showLabel: boolean;
    readonly value: number | null;
    readonly width: number;
    readonly x: number;
    readonly xIndex: number;
    readonly y: number;
    readonly yIndex: number;
}

interface HeatmapCellMarkPlan {
    readonly animationKey: string;
    readonly colorInterpolator: (t: number) => Color | undefined;
    readonly from: HeatmapCellMarkState;
    readonly to: HeatmapCellMarkState;
    readonly type: "enter" | "exit" | "update";
}

function toCellState(cell: SceneHeatmapCell, opacity = 1): HeatmapCellMarkState {
    return {
        animationKey: cell.animationKey,
        backgroundColor: cell.backgroundColor,
        borderColor: cell.borderColor,
        borderRadius: cell.borderRadius,
        borderWidth: cell.borderWidth,
        categoryX: cell.categoryX,
        categoryY: cell.categoryY,
        datum: cell.datum,
        formattedValue: cell.formattedValue,
        formattedX: cell.formattedX,
        formattedY: cell.formattedY,
        hasValue: cell.hasValue,
        height: cell.height,
        labelColor: cell.labelColor,
        numericValue: cell.numericValue,
        opacity: cell.opacity !== undefined ? cell.opacity * opacity : opacity,
        rawValue: cell.rawValue,
        showLabel: cell.showLabel,
        value: cell.value,
        width: cell.width,
        x: cell.x,
        xIndex: cell.xIndex,
        y: cell.y,
        yIndex: cell.yIndex
    };
}

export class HeatmapAnimationAdapter {
    public static createPlan(
        fromSeries: ChartHeatmapSeriesScene | null,
        toSeries: ChartHeatmapSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan {
        const id = toSeries?.id ?? fromSeries?.id ?? "heatmap";
        const templateSeries = toSeries ?? fromSeries!;
        const cellPlans: HeatmapCellMarkPlan[] = [];

        if (fromSeries && toSeries) {
            const fromCellMap = new Map<string, SceneHeatmapCell>();
            for (const c of fromSeries.cells) {
                fromCellMap.set(c.animationKey, c);
            }

            const matchedKeys = new Set<string>();

            for (const toCell of toSeries.cells) {
                matchedKeys.add(toCell.animationKey);
                const fromCell = fromCellMap.get(toCell.animationKey);

                if (fromCell) {
                    let colorInterpolator: (t: number) => Color | undefined;
                    try {
                        colorInterpolator = interpolate([fromCell.backgroundColor, toCell.backgroundColor], "oklab");
                    } catch {
                        colorInterpolator = () => parse(toCell.backgroundColor);
                    }

                    cellPlans.push({
                        animationKey: toCell.animationKey,
                        colorInterpolator,
                        from: toCellState(fromCell, 1),
                        to: toCellState(toCell, 1),
                        type: "update"
                    });
                } else {
                    cellPlans.push({
                        animationKey: toCell.animationKey,
                        colorInterpolator: () => parse(toCell.backgroundColor),
                        from: toCellState(toCell, 0),
                        to: toCellState(toCell, 1),
                        type: "enter"
                    });
                }
            }

            for (const fromCell of fromSeries.cells) {
                if (!matchedKeys.has(fromCell.animationKey)) {
                    cellPlans.push({
                        animationKey: fromCell.animationKey,
                        colorInterpolator: () => parse(fromCell.backgroundColor),
                        from: toCellState(fromCell, 1),
                        to: toCellState(fromCell, 0),
                        type: "exit"
                    });
                }
            }
        } else if (toSeries) {
            for (const toCell of toSeries.cells) {
                cellPlans.push({
                    animationKey: toCell.animationKey,
                    colorInterpolator: () => parse(toCell.backgroundColor),
                    from: toCellState(toCell, 0),
                    to: toCellState(toCell, 1),
                    type: "enter"
                });
            }
        } else if (fromSeries) {
            for (const fromCell of fromSeries.cells) {
                cellPlans.push({
                    animationKey: fromCell.animationKey,
                    colorInterpolator: () => parse(fromCell.backgroundColor),
                    from: toCellState(fromCell, 1),
                    to: toCellState(fromCell, 0),
                    type: "exit"
                });
            }
        }

        return {
            adapterType: "heatmap",
            fromSeries,
            id,
            sample: (progress: number) => {
                const sampledCells: SceneHeatmapCell[] = [];

                for (const plan of cellPlans) {
                    const opacity = lerpOpacity(plan.from.opacity, plan.to.opacity, progress);
                    if (opacity <= 0.001 && plan.type === "exit") {
                        continue;
                    }

                    let backgroundColor = plan.to.backgroundColor;
                    try {
                        const culoriColor = plan.colorInterpolator(progress);
                        if (culoriColor) {
                            backgroundColor = formatRgb(culoriColor) || backgroundColor;
                        }
                    } catch {
                        backgroundColor = plan.to.backgroundColor;
                    }

                    sampledCells.push({
                        animationKey: plan.animationKey,
                        backgroundColor,
                        borderColor: plan.to.borderColor,
                        borderRadius: lerp(plan.from.borderRadius, plan.to.borderRadius, progress),
                        borderWidth: lerp(plan.from.borderWidth, plan.to.borderWidth, progress),
                        categoryX: plan.to.categoryX,
                        categoryY: plan.to.categoryY,
                        datum: plan.to.datum,
                        formattedValue: plan.to.formattedValue,
                        formattedX: plan.to.formattedX,
                        formattedY: plan.to.formattedY,
                        hasValue: plan.to.hasValue,
                        height: lerp(plan.from.height, plan.to.height, progress),
                        labelColor: plan.to.labelColor,
                        numericValue: plan.to.numericValue,
                        opacity,
                        rawValue: plan.to.rawValue,
                        showLabel: plan.to.showLabel,
                        value: plan.to.value,
                        width: lerp(plan.from.width, plan.to.width, progress),
                        x: lerp(plan.from.x, plan.to.x, progress),
                        xIndex: plan.to.xIndex,
                        y: lerp(plan.from.y, plan.to.y, progress),
                        yIndex: plan.to.yIndex
                    });
                }

                const sampledScene: ChartHeatmapSeriesScene = {
                    ...templateSeries,
                    cells: sampledCells
                };
                return sampledScene;
            },
            toSeries
        };
    }
}
