import type { ChartPoint } from "../../../models/chart.models";
import type {
    ChartGaugeSeriesScene,
    ChartRadialArcSeriesScene,
    ChartRadialBarSeriesScene,
    ChartRoseSeriesScene,
    SceneGaugeNeedle,
    SceneGaugeValue,
    SceneRadialArcMark,
    SceneRadialTrack
} from "../../scene/polar-arc-scene";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface RadialArcMarkPlan {
    readonly animationKey: string;
    readonly from: SceneRadialArcMark;
    readonly to: SceneRadialArcMark;
    readonly type: "enter" | "exit" | "update";
}

function createCollapsedRadialBarMark(mark: SceneRadialArcMark, opacity = 0): SceneRadialArcMark {
    return {
        ...mark,
        endAngle: mark.startAngle,
        renderOpacity: opacity
    };
}

function createCollapsedRoseMark(mark: SceneRadialArcMark, opacity = 0): SceneRadialArcMark {
    return {
        ...mark,
        outerRadius: mark.innerRadius,
        renderOpacity: opacity
    };
}

function sampleRadialArcMark(
    plan: RadialArcMarkPlan,
    progress: number
): SceneRadialArcMark {
    const { from, to } = plan;
    const startAngle = lerp(from.startAngle, to.startAngle, progress);
    const endAngle = lerp(from.endAngle, to.endAngle, progress);
    const innerRadius = lerp(from.innerRadius, to.innerRadius, progress);
    const outerRadius = lerp(from.outerRadius, to.outerRadius, progress);
    const padAngle = lerp(from.padAngle, to.padAngle, progress);
    const cornerRadius = lerp(from.cornerRadius, to.cornerRadius, progress);
    const renderOpacity = lerpOpacity(from.renderOpacity ?? 1, to.renderOpacity ?? 1, progress);

    return {
        animationKey: to.animationKey ?? from.animationKey,
        category: to.category,
        color: to.color,
        cornerRadius,
        dataIndex: to.dataIndex,
        datum: to.datum,
        endAngle,
        formattedCategory: to.formattedCategory,
        formattedValue: to.formattedValue,
        innerRadius,
        itemId: to.itemId,
        normalizedValue: to.normalizedValue !== undefined && from.normalizedValue !== undefined
            ? lerp(from.normalizedValue, to.normalizedValue, progress)
            : to.normalizedValue,
        outerRadius,
        padAngle,
        rawValue: lerp(from.rawValue, to.rawValue, progress),
        renderOpacity,
        startAngle,
        visible: to.visible
    };
}

export class RadialArcAnimationAdapter implements ChartSeriesAnimationAdapter<ChartRadialArcSeriesScene> {
    public createPlan(
        previous: ChartRadialArcSeriesScene | null,
        target: ChartRadialArcSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartRadialArcSeriesScene> {
        const type = target?.type ?? previous?.type ?? "radialBar";
        const id = target?.id ?? previous?.id ?? type;

        if (!previous && !target) {
            return {
                adapterType: type,
                fromSeries: null,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        if (type === "radialBar") {
            return this.#planRadialBar(previous as ChartRadialBarSeriesScene | null, target as ChartRadialBarSeriesScene | null, id);
        }

        if (type === "rose") {
            return this.#planRose(previous as ChartRoseSeriesScene | null, target as ChartRoseSeriesScene | null, id);
        }

        return this.#planGauge(previous as ChartGaugeSeriesScene | null, target as ChartGaugeSeriesScene | null, id);
    }

    #planRadialBar(
        previous: ChartRadialBarSeriesScene | null,
        target: ChartRadialBarSeriesScene | null,
        id: string
    ): ChartSeriesTransitionPlan<ChartRadialBarSeriesScene> {
        const markPlans: RadialArcMarkPlan[] = [];

        if (!previous && target) {
            for (const mark of target.marks) {
                markPlans.push({
                    animationKey: mark.animationKey,
                    from: createCollapsedRadialBarMark(mark, 0),
                    to: { ...mark, renderOpacity: 1 },
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            for (const mark of previous.marks) {
                markPlans.push({
                    animationKey: mark.animationKey,
                    from: { ...mark, renderOpacity: 1 },
                    to: createCollapsedRadialBarMark(mark, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            const prevByKey = new Map<string, SceneRadialArcMark>();
            for (const mark of previous.marks) {
                prevByKey.set(mark.animationKey, mark);
            }

            const targetKeys = new Set<string>();
            for (const mark of target.marks) {
                targetKeys.add(mark.animationKey);
                const prevMark = prevByKey.get(mark.animationKey);
                if (prevMark) {
                    markPlans.push({
                        animationKey: mark.animationKey,
                        from: { ...prevMark, renderOpacity: 1 },
                        to: { ...mark, renderOpacity: 1 },
                        type: "update"
                    });
                } else {
                    markPlans.push({
                        animationKey: mark.animationKey,
                        from: createCollapsedRadialBarMark(mark, 0),
                        to: { ...mark, renderOpacity: 1 },
                        type: "enter"
                    });
                }
            }

            for (const prevMark of previous.marks) {
                if (!targetKeys.has(prevMark.animationKey)) {
                    markPlans.push({
                        animationKey: prevMark.animationKey,
                        from: { ...prevMark, renderOpacity: 1 },
                        to: createCollapsedRadialBarMark(prevMark, 0),
                        type: "exit"
                    });
                }
            }
        }

        const baseScene = target ?? previous;
        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;

        return {
            adapterType: "radialBar",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene) {
                    return null;
                }

                const marks: SceneRadialArcMark[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    marks.push(sampleRadialArcMark(plan, progress));
                }

                const renderOpacity = lerpOpacity(fromOpacity, toOpacity, progress);

                return {
                    barGap: baseScene.barGap,
                    fillMode: baseScene.fillMode,
                    id: baseScene.id,
                    marks,
                    name: baseScene.name,
                    renderOpacity,
                    style: baseScene.style,
                    tracks: target?.tracks ?? previous?.tracks ?? [],
                    type: "radialBar"
                };
            },
            toSeries: target
        };
    }

    #planRose(
        previous: ChartRoseSeriesScene | null,
        target: ChartRoseSeriesScene | null,
        id: string
    ): ChartSeriesTransitionPlan<ChartRoseSeriesScene> {
        const markPlans: RadialArcMarkPlan[] = [];

        if (!previous && target) {
            for (const mark of target.marks) {
                markPlans.push({
                    animationKey: mark.animationKey,
                    from: createCollapsedRoseMark(mark, 0),
                    to: { ...mark, renderOpacity: 1 },
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            for (const mark of previous.marks) {
                markPlans.push({
                    animationKey: mark.animationKey,
                    from: { ...mark, renderOpacity: 1 },
                    to: createCollapsedRoseMark(mark, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            const prevByKey = new Map<string, SceneRadialArcMark>();
            for (const mark of previous.marks) {
                prevByKey.set(mark.animationKey, mark);
            }

            const targetKeys = new Set<string>();
            for (const mark of target.marks) {
                targetKeys.add(mark.animationKey);
                const prevMark = prevByKey.get(mark.animationKey);
                if (prevMark) {
                    markPlans.push({
                        animationKey: mark.animationKey,
                        from: { ...prevMark, renderOpacity: 1 },
                        to: { ...mark, renderOpacity: 1 },
                        type: "update"
                    });
                } else {
                    markPlans.push({
                        animationKey: mark.animationKey,
                        from: createCollapsedRoseMark(mark, 0),
                        to: { ...mark, renderOpacity: 1 },
                        type: "enter"
                    });
                }
            }

            for (const prevMark of previous.marks) {
                if (!targetKeys.has(prevMark.animationKey)) {
                    markPlans.push({
                        animationKey: prevMark.animationKey,
                        from: { ...prevMark, renderOpacity: 1 },
                        to: createCollapsedRoseMark(prevMark, 0),
                        type: "exit"
                    });
                }
            }
        }

        const baseScene = target ?? previous;
        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;

        return {
            adapterType: "rose",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene) {
                    return null;
                }

                const marks: SceneRadialArcMark[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    marks.push(sampleRadialArcMark(plan, progress));
                }

                const renderOpacity = lerpOpacity(fromOpacity, toOpacity, progress);

                return {
                    angularCategories: target?.angularCategories ?? previous?.angularCategories ?? [],
                    fillMode: baseScene.fillMode,
                    id: baseScene.id,
                    marks,
                    name: baseScene.name,
                    renderOpacity,
                    scaleMode: baseScene.scaleMode,
                    style: baseScene.style,
                    type: "rose"
                };
            },
            toSeries: target
        };
    }

    #planGauge(
        previous: ChartGaugeSeriesScene | null,
        target: ChartGaugeSeriesScene | null,
        id: string
    ): ChartSeriesTransitionPlan<ChartGaugeSeriesScene> {
        const baseScene = target ?? previous;
        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;

        const effectiveFromVal: SceneGaugeValue | undefined = previous?.value ?? (target?.value ? {
            ...target.value,
            cornerRadius: target.value.cornerRadius,
            endAngle: target.value.startAngle,
            ratio: 0,
            renderOpacity: 0
        } : undefined);

        const effectiveToVal: SceneGaugeValue | undefined = target?.value ?? (previous?.value ? {
            ...previous.value,
            cornerRadius: previous.value.cornerRadius,
            endAngle: previous.value.startAngle,
            ratio: 0,
            renderOpacity: 0
        } : undefined);

        const fromNeedle = previous?.needle;
        const toNeedle = target?.needle;

        return {
            adapterType: "gauge",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene || !effectiveToVal || !effectiveFromVal) {
                    return target ?? previous;
                }

                const startAngle = lerp(effectiveFromVal.startAngle, effectiveToVal.startAngle, progress);
                const endAngle = lerp(effectiveFromVal.endAngle, effectiveToVal.endAngle, progress);
                const innerRadius = lerp(effectiveFromVal.innerRadius, effectiveToVal.innerRadius, progress);
                const outerRadius = lerp(effectiveFromVal.outerRadius, effectiveToVal.outerRadius, progress);
                const ratio = lerp(effectiveFromVal.ratio, effectiveToVal.ratio, progress);
                const rawValue = lerp(effectiveFromVal.rawValue, effectiveToVal.rawValue, progress);
                const cornerRadius = lerp(effectiveFromVal.cornerRadius, effectiveToVal.cornerRadius, progress);
                const renderOpacity = lerpOpacity(fromOpacity, toOpacity, progress);

                const sampledValue: SceneGaugeValue = {
                    animationKey: effectiveToVal.animationKey,
                    cornerRadius,
                    dataIndex: effectiveToVal.dataIndex,
                    datum: effectiveToVal.datum,
                    endAngle,
                    formattedValue: effectiveToVal.formattedValue,
                    innerRadius,
                    isClamped: effectiveToVal.isClamped,
                    max: effectiveToVal.max,
                    min: effectiveToVal.min,
                    outerRadius,
                    ratio,
                    rawValue,
                    renderOpacity,
                    startAngle
                };

                let sampledNeedle: SceneGaugeNeedle | undefined;
                if (toNeedle || fromNeedle) {
                    const baseNeedle = toNeedle ?? fromNeedle!;
                    const angle = fromNeedle && toNeedle ? lerp(fromNeedle.angle, toNeedle.angle, progress) : (toNeedle?.angle ?? fromNeedle!.angle);
                    const length = fromNeedle && toNeedle ? lerp(fromNeedle.length, toNeedle.length, progress) : baseNeedle.length;
                    const width = fromNeedle && toNeedle ? lerp(fromNeedle.width, toNeedle.width, progress) : baseNeedle.width;

                    sampledNeedle = {
                        angle,
                        color: baseNeedle.color,
                        hubColor: baseNeedle.hubColor,
                        hubRadius: baseNeedle.hubRadius,
                        length,
                        width
                    };
                }

                return {
                    fillMode: baseScene.fillMode,
                    id: baseScene.id,
                    indicator: baseScene.indicator,
                    name: baseScene.name,
                    needle: sampledNeedle,
                    renderOpacity,
                    showValue: baseScene.showValue,
                    style: baseScene.style,
                    track: target?.track ?? previous?.track ?? baseScene.track,
                    type: "gauge",
                    value: sampledValue
                };
            },
            toSeries: target
        };
    }
}
