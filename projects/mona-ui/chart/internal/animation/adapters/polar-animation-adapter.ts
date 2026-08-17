import type { ChartPoint } from "../../../models/chart.models";
import type { ChartContinuousPolarSeriesScene, SceneRadialPoint } from "../../scene/polar-axis-scene";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import {
    type RadialPointTransitionPlan,
    type RadialPointTransitionState,
    sampleRadialPointTransition
} from "../primitives/radial-point-transition";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

function toRadialState(pt: SceneRadialPoint, opacity = 1): RadialPointTransitionState {
    return {
        angle: pt.angle,
        animationKey: pt.animationKey,
        category: pt.category,
        categoryKey: pt.categoryKey,
        dataIndex: pt.dataIndex,
        datum: pt.datum,
        defined: pt.defined,
        formattedAngle: pt.formattedAngle,
        formattedCategory: pt.formattedCategory,
        formattedValue: pt.formattedValue,
        normalizedAngle: pt.normalizedAngle,
        opacity,
        point: pt.point,
        radius: pt.radius,
        rawAngle: pt.rawAngle,
        value: pt.value
    };
}

function createPoleRadialState(pt: SceneRadialPoint, center: ChartPoint, opacity = 0): RadialPointTransitionState {
    return {
        angle: pt.angle,
        animationKey: pt.animationKey,
        category: pt.category,
        categoryKey: pt.categoryKey,
        dataIndex: pt.dataIndex,
        datum: pt.datum,
        defined: pt.defined,
        formattedAngle: pt.formattedAngle,
        formattedCategory: pt.formattedCategory,
        formattedValue: pt.formattedValue,
        normalizedAngle: pt.normalizedAngle,
        opacity,
        point: center,
        radius: 0,
        rawAngle: pt.rawAngle,
        value: pt.value
    };
}

export class PolarSeriesAnimationAdapter implements ChartSeriesAnimationAdapter<ChartContinuousPolarSeriesScene> {
    readonly #center: ChartPoint;

    public constructor(center: ChartPoint = { x: 0, y: 0 }) {
        this.#center = center;
    }

    public readonly type = "polar";

    public createPlan(
        previous: ChartContinuousPolarSeriesScene | null,
        target: ChartContinuousPolarSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartContinuousPolarSeriesScene> {
        const id = target?.id ?? previous?.id ?? "polar";

        if (!previous && !target) {
            return {
                adapterType: "polar",
                fromSeries: null,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        const markPlans: RadialPointTransitionPlan[] = [];

        if (!previous && target) {
            // Enter
            for (const pt of target.points) {
                markPlans.push({
                    animationKey: pt.animationKey ?? String(pt.dataIndex),
                    from: createPoleRadialState(pt, this.#center, 0),
                    to: toRadialState(pt, 1),
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            // Exit
            for (const pt of previous.points) {
                markPlans.push({
                    animationKey: pt.animationKey ?? String(pt.dataIndex),
                    from: toRadialState(pt, 1),
                    to: createPoleRadialState(pt, this.#center, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            // Update
            const prevByKey = new Map<string, SceneRadialPoint>();
            for (const pt of previous.points) {
                const key = pt.animationKey ?? String(pt.dataIndex);
                prevByKey.set(key, pt);
            }

            const targetKeys = new Set<string>();

            for (const pt of target.points) {
                const key = pt.animationKey ?? String(pt.dataIndex);
                targetKeys.add(key);
                const prevPt = prevByKey.get(key);

                if (prevPt) {
                    const angleChanged = Math.abs(prevPt.angle - pt.angle) > 1e-4;
                    markPlans.push({
                        animationKey: key,
                        from: toRadialState(prevPt, 1),
                        interpolateAngleCircularly: angleChanged,
                        to: toRadialState(pt, 1),
                        type: "update"
                    });
                } else {
                    markPlans.push({
                        animationKey: key,
                        from: createPoleRadialState(pt, this.#center, 0),
                        to: toRadialState(pt, 1),
                        type: "enter"
                    });
                }
            }

            // Exiting points
            for (const prevPt of previous.points) {
                const key = prevPt.animationKey ?? String(prevPt.dataIndex);
                if (!targetKeys.has(key)) {
                    markPlans.push({
                        animationKey: key,
                        from: toRadialState(prevPt, 1),
                        to: createPoleRadialState(prevPt, this.#center, 0),
                        type: "exit"
                    });
                }
            }
        }

        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;
        const baseScene = target ?? previous;
        const fromMaxRadius = previous ? previous.maxRenderedRadius : 0;
        const toMaxRadius = target ? target.maxRenderedRadius : 0;

        return {
            adapterType: "polar",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene) {
                    return null;
                }

                const points: SceneRadialPoint[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    points.push(sampleRadialPointTransition(plan, progress, this.#center));
                }

                const renderOpacity = lerpOpacity(fromOpacity, toOpacity, progress);
                const maxRenderedRadius = lerp(fromMaxRadius, toMaxRadius, progress);

                return {
                    color: baseScene.color,
                    connectNulls: baseScene.connectNulls,
                    curve: baseScene.curve,
                    fillMode: baseScene.fillMode,
                    fillOpacity: baseScene.fillOpacity,
                    id: baseScene.id,
                    maxRenderedRadius,
                    name: baseScene.name,
                    pointRadius: baseScene.pointRadius,
                    points,
                    renderOpacity,
                    showPoints: baseScene.showPoints,
                    strokeWidth: baseScene.strokeWidth,
                    type: "polar"
                };
            },
            toSeries: target
        };
    }
}
