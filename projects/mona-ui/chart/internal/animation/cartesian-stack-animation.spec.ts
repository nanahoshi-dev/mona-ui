import { describe, expect, it } from "vitest";
import { ChartTransitionPlanner } from "./chart-transition-planner";
import { SceneTransitionSampler } from "./scene-transition-sampler";
import { normalizeChartAnimationOptions } from "./chart-animation-options";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneAreaPoint, SceneHitTarget } from "../scene/scene-geometry";

describe("Cartesian Stack Animation Planning & Sampling", () => {
    describe("Path Topology Compatibility (STK-014)", () => {
        it("should return true when animationKey, defined, and synthetic match", () => {
            const prev: readonly SceneAreaPoint[] = [
                { animationKey: "k1", baseY: 100, datum: {}, defined: true, index: 0, synthetic: false, x: 10, xValue: 1, y: 50, yValue: 50 },
                { animationKey: "k2", baseY: 100, datum: {}, defined: true, index: 1, synthetic: true, x: 20, xValue: 2, y: 100, yValue: 0 }
            ];
            const target: readonly SceneAreaPoint[] = [
                { animationKey: "k1", baseY: 100, datum: {}, defined: true, index: 0, synthetic: false, x: 10, xValue: 1, y: 30, yValue: 70 },
                { animationKey: "k2", baseY: 100, datum: {}, defined: true, index: 1, synthetic: true, x: 20, xValue: 2, y: 100, yValue: 0 }
            ];

            expect(ChartTransitionPlanner.isPathTopologyCompatible(prev, target)).toBe(true);
        });

        it("should return false when synthetic property mismatches between previous and target (STK-014)", () => {
            const prev: readonly SceneAreaPoint[] = [
                { animationKey: "k1", baseY: 100, datum: {}, defined: true, index: 0, synthetic: false, x: 10, xValue: 1, y: 50, yValue: 50 },
                { animationKey: "k2", baseY: 100, datum: {}, defined: true, index: 1, synthetic: true, x: 20, xValue: 2, y: 100, yValue: 0 }
            ];
            const target: readonly SceneAreaPoint[] = [
                { animationKey: "k1", baseY: 100, datum: {}, defined: true, index: 0, synthetic: false, x: 10, xValue: 1, y: 30, yValue: 70 },
                { animationKey: "k2", baseY: 100, datum: {}, defined: true, index: 1, synthetic: false, x: 20, xValue: 2, y: 80, yValue: 20 }
            ];

            expect(ChartTransitionPlanner.isPathTopologyCompatible(prev, target)).toBe(false);
        });
    });

    describe("Stack Signature Crossfade vs Morph (STK-013)", () => {
        const dummyPlotRect = { height: 200, width: 400, x: 50, y: 50 };

        it("should plan crossfade transition when stackSignature changes", () => {
            const fromScene: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect: dummyPlotRect,
                series: [],
                stackSignature: "sig-normal-v1",
                width: 500,
                xAxisType: "category"
            };

            const toScene: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect: dummyPlotRect,
                series: [],
                stackSignature: "sig-percent-v2", // Mismatched signature
                width: 500,
                xAxisType: "category"
            };

            const options = normalizeChartAnimationOptions(true);
            const plan = ChartTransitionPlanner.plan(fromScene, toScene, "data", options);

            expect(plan.mode).toBe("crossfade");
        });
    });

    describe("SceneTransitionSampler Zero-Height Bounds (STK-011)", () => {
        it("should keep bounds undefined for zero-height stacked bar targets during sampling", () => {
            const targetHit: SceneHitTarget = {
                animationKey: "k1",
                bounds: undefined, // zero height bar
                datum: {},
                formattedCategory: "Jan",
                formattedValue: "0",
                index: 0,
                renderOrder: 1,
                seriesId: "s1",
                seriesName: "S1",
                seriesType: "bar",
                stackGroup: "sales",
                visualBounds: { height: 0, width: 20, x: 50, y: 100 },
                xKey: "Jan",
                xValue: "Jan",
                yValue: 0
            };

            const toScene: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 300,
                hitTargets: [targetHit],
                interactionBuckets: [],
                legendItems: [],
                plotRect: { height: 200, width: 400, x: 50, y: 50 },
                series: [{
                    bars: [{
                        animationKey: "k1",
                        cornerRadii: { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 },
                        datum: {},
                        height: 0,
                        index: 0,
                        isPositive: true,
                        radius: 0,
                        width: 20,
                        x: 50,
                        xValue: "Jan",
                        y: 100,
                        yValue: 0
                    }],
                    borderRadius: 0,
                    fillOpacity: 1,
                    id: "s1",
                    name: "S1",
                    style: { areaFillColor: "#3b82f6", areaFillOpacity: 1, color: "#3b82f6", fillOpacity: 1, lineWidth: 1, opacity: 1, pointRadius: 4 },
                    type: "bar",
                    xAxisId: "default-x",
                    yAxisId: "default-y"
                }],
                width: 500,
                xAxisType: "category"
            };

            const options = normalizeChartAnimationOptions(true);
            const plan = ChartTransitionPlanner.plan(null, toScene, "initial", options);

            const frame = SceneTransitionSampler.sampleFrame(plan, 0.5);
            const sampledCartesian = frame.scene as CartesianXYChartScene;
            expect(sampledCartesian.hitTargets.length).toBe(1);
            expect(sampledCartesian.hitTargets[0].bounds).toBeUndefined();
            expect(sampledCartesian.barHitTargets?.length).toBe(0);
        });
    });
});
