import type { ChartAxisScene } from "../../scene/cartesian-scene";
import type { ChartAngularAxisScene, ChartRadialAxisScene } from "../../scene/polar-axis-scene";
import { lerp } from "../animation-math";

export interface CartesianAxisTransitionPlan {
    readonly sample: (progress: number) => readonly ChartAxisScene[];
}

export interface PolarAxisTransitionPlan {
    readonly sample: (progress: number) => {
        angularAxis?: ChartAngularAxisScene;
        radialAxis?: ChartRadialAxisScene;
    };
}

export class AxisAnimationAdapter {
    public static createCartesianAxisPlan(
        previousAxes: readonly ChartAxisScene[] | undefined,
        targetAxes: readonly ChartAxisScene[]
    ): CartesianAxisTransitionPlan {
        if (!previousAxes || previousAxes.length === 0) {
            return { sample: (_p: number) => targetAxes };
        }

        return {
            sample: (progress: number) => {
                if (progress >= 1) {
                    return targetAxes;
                }

                return targetAxes.map(targetAxis => {
                    const prevAxis = previousAxes.find(a => {
                        if (targetAxis.axisId && a.axisId) {
                            return a.axisId === targetAxis.axisId && a.axis === targetAxis.axis;
                        }
                        if (targetAxis.axisId || a.axisId) {
                            return (targetAxis.axisId ?? a.axisId) === (a.axisId ?? targetAxis.axisId) && a.axis === targetAxis.axis;
                        }
                        return a.axis === targetAxis.axis && a.position === targetAxis.position;
                    });

                    if (!prevAxis) {
                        return targetAxis;
                    }

                    const prevTicksByVal = new Map(prevAxis.ticks.map(t => [String(t.value), t.coordinate]));

                    const interpolatedTicks = targetAxis.ticks.map(tick => {
                        const prevCoord = prevTicksByVal.get(String(tick.value));
                        if (prevCoord === undefined) {
                            return tick;
                        }
                        return {
                            ...tick,
                            coordinate: lerp(prevCoord, tick.coordinate, progress)
                        };
                    });

                    const interpolatedGutter = prevAxis.gutter !== undefined && targetAxis.gutter !== undefined
                        ? lerp(prevAxis.gutter, targetAxis.gutter, progress)
                        : targetAxis.gutter;

                    const interpolatedSideOffset = prevAxis.sideOffset !== undefined && targetAxis.sideOffset !== undefined
                        ? lerp(prevAxis.sideOffset, targetAxis.sideOffset, progress)
                        : targetAxis.sideOffset;

                    return {
                        ...targetAxis,
                        gutter: interpolatedGutter,
                        sideOffset: interpolatedSideOffset,
                        ticks: interpolatedTicks
                    };
                });
            }
        };
    }

    public static createPolarAxisPlan(
        previous: { angularAxis?: ChartAngularAxisScene; radialAxis?: ChartRadialAxisScene } | undefined,
        target: { angularAxis?: ChartAngularAxisScene; radialAxis?: ChartRadialAxisScene }
    ): PolarAxisTransitionPlan {
        if (!previous) {
            return { sample: (_p: number) => target };
        }

        return {
            sample: (progress: number) => {
                if (progress >= 1) {
                    return target;
                }

                if (!target.radialAxis) {
                    return {
                        angularAxis: target.angularAxis,
                        radialAxis: undefined
                    };
                }

                const prevRadial = previous.radialAxis;
                const prevRadialTicks = prevRadial ? new Map(prevRadial.ticks.map(t => [t.tickKey, t.radius])) : null;

                const interpolatedRadialTicks = target.radialAxis.ticks.map(tick => {
                    const prevRadius = prevRadialTicks?.get(tick.tickKey);
                    if (prevRadius === undefined) {
                        return tick;
                    }
                    return {
                        ...tick,
                        radius: lerp(prevRadius, tick.radius, progress)
                    };
                });

                return {
                    angularAxis: target.angularAxis,
                    radialAxis: {
                        ...target.radialAxis,
                        ticks: interpolatedRadialTicks
                    }
                };
            }
        };
    }
}
