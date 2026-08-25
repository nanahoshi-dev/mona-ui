import type { ChartSeriesType } from "../../../models/chart-series.models";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";

export interface ChartSeriesAnimationAdapter<TScene = unknown> {
    createPlan(
        previous: TScene | null,
        target: TScene | null,
        context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<TScene>;
    readonly type?: ChartSeriesType;
}
