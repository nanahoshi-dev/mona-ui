import type { ChartSectorSeriesScene, SceneSectorSlice } from "../../scene/polar-scene";
import { lerp, lerpOpacity, lerpPoint } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import {
    type ArcMarkTransitionPlan,
    type ArcMarkTransitionState,
    sampleArcTransition
} from "../primitives/arc-transition";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

function toArcState(slice: SceneSectorSlice, opacity = 1): ArcMarkTransitionState {
    return {
        animationKey: slice.animationKey,
        category: slice.category,
        color: slice.color,
        cornerRadius: slice.cornerRadius,
        dataIndex: slice.dataIndex,
        datum: slice.datum,
        endAngle: slice.endAngle,
        formattedCategory: slice.formattedCategory,
        formattedPercentage: slice.formattedPercentage,
        formattedValue: slice.formattedValue,
        innerRadius: slice.innerRadius,
        insideLabelBackgroundColor: slice.insideLabelBackgroundColor,
        opacity,
        outerRadius: slice.outerRadius,
        padAngle: slice.padAngle,
        percentage: slice.percentage,
        sliceId: slice.sliceId,
        startAngle: slice.startAngle,
        value: slice.value,
        visible: slice.visible
    };
}

function createCollapsedArcState(slice: SceneSectorSlice, opacity = 0): ArcMarkTransitionState {
    return {
        animationKey: slice.animationKey,
        category: slice.category,
        color: slice.color,
        cornerRadius: slice.cornerRadius,
        dataIndex: slice.dataIndex,
        datum: slice.datum,
        endAngle: slice.startAngle,
        formattedCategory: slice.formattedCategory,
        formattedPercentage: slice.formattedPercentage,
        formattedValue: slice.formattedValue,
        innerRadius: slice.innerRadius,
        insideLabelBackgroundColor: slice.insideLabelBackgroundColor,
        opacity,
        outerRadius: slice.outerRadius,
        padAngle: slice.padAngle,
        percentage: slice.percentage,
        sliceId: slice.sliceId,
        startAngle: slice.startAngle,
        value: slice.value,
        visible: slice.visible
    };
}

export class SectorSeriesAnimationAdapter implements ChartSeriesAnimationAdapter<ChartSectorSeriesScene> {
    readonly #type: "donut" | "pie";

    public constructor(type: "donut" | "pie" = "pie") {
        this.#type = type;
    }

    public get type(): "donut" | "pie" {
        return this.#type;
    }

    public createPlan(
        previous: ChartSectorSeriesScene | null,
        target: ChartSectorSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartSectorSeriesScene> {
        const id = target?.id ?? previous?.id ?? this.#type;

        if (!previous && !target) {
            return {
                adapterType: this.#type,
                fromSeries: null,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        const markPlans: ArcMarkTransitionPlan[] = [];

        if (!previous && target) {
            // Enter
            for (const slice of target.slices) {
                markPlans.push({
                    animationKey: slice.animationKey ?? slice.sliceId,
                    from: createCollapsedArcState(slice, 0),
                    to: toArcState(slice, 1),
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            // Exit
            for (const slice of previous.slices) {
                markPlans.push({
                    animationKey: slice.animationKey ?? slice.sliceId,
                    from: toArcState(slice, 1),
                    to: createCollapsedArcState(slice, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            // Update
            const prevByKey = new Map<string, SceneSectorSlice>();
            for (const slice of previous.slices) {
                const key = slice.animationKey ?? slice.sliceId;
                prevByKey.set(key, slice);
            }

            const targetKeys = new Set<string>();

            for (const slice of target.slices) {
                const key = slice.animationKey ?? slice.sliceId;
                targetKeys.add(key);
                const prevSlice = prevByKey.get(key);

                if (prevSlice) {
                    markPlans.push({
                        animationKey: key,
                        from: toArcState(prevSlice, 1),
                        to: toArcState(slice, 1),
                        type: "update"
                    });
                } else {
                    markPlans.push({
                        animationKey: key,
                        from: createCollapsedArcState(slice, 0),
                        to: toArcState(slice, 1),
                        type: "enter"
                    });
                }
            }

            // Exiting slices
            for (const prevSlice of previous.slices) {
                const key = prevSlice.animationKey ?? prevSlice.sliceId;
                if (!targetKeys.has(key)) {
                    markPlans.push({
                        animationKey: key,
                        from: toArcState(prevSlice, 1),
                        to: createCollapsedArcState(prevSlice, 0),
                        type: "exit"
                    });
                }
            }
        }

        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;
        const baseScene = target ?? previous;
        const fromCenter = previous?.center ?? target?.center ?? { x: 0, y: 0 };
        const toCenter = target?.center ?? previous?.center ?? { x: 0, y: 0 };
        const fromInner = previous?.innerRadius ?? target?.innerRadius ?? 0;
        const toInner = target?.innerRadius ?? previous?.innerRadius ?? 0;
        const fromOuter = previous?.outerRadius ?? target?.outerRadius ?? 0;
        const toOuter = target?.outerRadius ?? previous?.outerRadius ?? 0;
        const fromTotal = previous?.total ?? target?.total ?? 0;
        const toTotal = target?.total ?? previous?.total ?? 0;

        return {
            adapterType: this.#type,
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene) {
                    return null;
                }

                const currentCenter = lerpPoint(fromCenter, toCenter, progress);
                const slices: SceneSectorSlice[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    slices.push(sampleArcTransition(plan, progress, currentCenter));
                }

                const renderOpacity = lerpOpacity(fromOpacity, toOpacity, progress);
                const innerRadius = lerp(fromInner, toInner, progress);
                const outerRadius = lerp(fromOuter, toOuter, progress);
                const total = lerp(fromTotal, toTotal, progress);

                return {
                    center: currentCenter,
                    cornerRadius: baseScene.cornerRadius,
                    fillMode: baseScene.fillMode,
                    formattedTotal: target?.formattedTotal ?? previous?.formattedTotal ?? "",
                    id: baseScene.id,
                    innerRadius,
                    labelPosition: baseScene.labelPosition,
                    name: baseScene.name,
                    outerRadius,
                    padAngle: baseScene.padAngle,
                    renderOpacity,
                    showLabels: baseScene.showLabels,
                    slices,
                    style: baseScene.style,
                    total,
                    type: baseScene.type
                };
            },
            toSeries: target
        };
    }
}
