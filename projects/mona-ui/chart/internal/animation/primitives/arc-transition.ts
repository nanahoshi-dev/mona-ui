import type { ChartPoint } from "../../../models/chart.models";
import type { SceneSectorSlice } from "../../scene/polar-scene";
import { lerp } from "../animation-math";

export interface ArcMarkTransitionState {
    readonly animationKey?: string;
    readonly category: unknown;
    readonly color: string;
    readonly cornerRadius: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly endAngle: number;
    readonly formattedCategory: string;
    readonly formattedPercentage: string;
    readonly formattedValue: string;
    readonly innerRadius: number;
    readonly insideLabelBackgroundColor: string;
    readonly opacity: number;
    readonly outerRadius: number;
    readonly padAngle: number;
    readonly percentage: number;
    readonly sliceId: string;
    readonly startAngle: number;
    readonly value: number;
    readonly visible: boolean;
}

export interface ArcMarkTransitionPlan {
    readonly animationKey?: string;
    readonly from: ArcMarkTransitionState;
    readonly to: ArcMarkTransitionState;
    readonly type: "enter" | "exit" | "update";
}

export function sampleArcTransition(
    plan: ArcMarkTransitionPlan,
    progress: number,
    center: ChartPoint
): SceneSectorSlice {
    const { from, to } = plan;
    const startAngle = lerp(from.startAngle, to.startAngle, progress);
    const endAngle = lerp(from.endAngle, to.endAngle, progress);
    const innerRadius = lerp(from.innerRadius, to.innerRadius, progress);
    const outerRadius = lerp(from.outerRadius, to.outerRadius, progress);
    const padAngle = lerp(from.padAngle, to.padAngle, progress);
    const cornerRadius = lerp(from.cornerRadius, to.cornerRadius, progress);

    const midAngle = (startAngle + endAngle) / 2;
    const midRadius = (innerRadius + outerRadius) / 2;
    const labelRadius = innerRadius + (outerRadius - innerRadius) * 0.55;

    const centroid: ChartPoint = {
        x: center.x + Math.sin(midAngle) * midRadius,
        y: center.y - Math.cos(midAngle) * midRadius
    };

    const insideLabelPoint: ChartPoint = {
        x: center.x + Math.sin(midAngle) * labelRadius,
        y: center.y - Math.cos(midAngle) * labelRadius
    };

    return {
        animationKey: to.animationKey ?? from.animationKey,
        category: to.category,
        centroid,
        color: to.color,
        cornerRadius,
        dataIndex: to.dataIndex,
        datum: to.datum,
        endAngle,
        formattedCategory: to.formattedCategory,
        formattedPercentage: to.formattedPercentage,
        formattedValue: to.formattedValue,
        innerRadius,
        insideLabelBackgroundColor: to.insideLabelBackgroundColor,
        insideLabelPoint,
        outerRadius,
        padAngle,
        percentage: to.percentage,
        sliceId: to.sliceId,
        startAngle,
        value: to.value,
        visible: to.visible
    };
}
