import { describe, expect, it } from "vitest";
import type { CartesianChartScene, PolarSectorChartScene } from "../scene/chart-scene";
import type { ChartBarSeriesScene } from "../scene/cartesian-scene";
import { BarSeriesAnimationAdapter } from "./adapters/bar-animation-adapter";
import { SectorSeriesAnimationAdapter } from "./adapters/sector-animation-adapter";
import { SceneTransitionSampler } from "./scene-transition-sampler";
import type { ChartTransitionPlan } from "./chart-transition-types";

describe("SceneTransitionSampler", () => {
    it("should sample cartesian bar scene at progress 0, 0.5, and 1", () => {
        const toScene: CartesianChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [
                {
                    animationKey: "b1:k1",
                    bounds: { height: 100, width: 20, x: 50, y: 100 },
                    datum: {},
                    index: 0,
                    seriesId: "b1",
                    seriesName: "Bar",
                    seriesType: "bar",
                    xKey: "k1",
                    xValue: "k1",
                    yValue: 10
                }
            ],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 260, width: 460, x: 20, y: 20 },
            series: [
                {
                    bars: [
                        {
                            animationKey: "b1:k1",
                            datum: {},
                            height: 100,
                            index: 0,
                            isPositive: true,
                            radius: 4,
                            width: 20,
                            x: 50,
                            xValue: "k1",
                            y: 100,
                            yValue: 10
                        }
                    ],
                    borderRadius: 4,
                    fillOpacity: 1,
                    id: "b1",
                    name: "Bar",
                    style: { areaFillColor: "#3b82f6", areaFillOpacity: 0.2, color: "#3b82f6", fillOpacity: 1, lineWidth: 2, opacity: 1, pointRadius: 4 },
                    type: "bar"
                }
            ],
            width: 500
        };

        const adapter = new BarSeriesAnimationAdapter();
        const barSeries = toScene.series[0] as ChartBarSeriesScene;
        const seriesPlan = adapter.createPlan(null, barSeries, {
            options: { data: true, duration: 400, easing: "linear", enabled: true, initial: true, visibility: true },
            plotRect: toScene.plotRect,
            trigger: "initial"
        });

        const plan: ChartTransitionPlan = {
            complexity: { independentMarks: 1, markCount: 1, pathCount: 0, pathPoints: 0, pointCount: 0, totalWeightedCost: 1 },
            duration: 400,
            easing: "linear",
            fromScene: null,
            mode: "morph",
            seriesPlans: [seriesPlan],
            toScene,
            trigger: "initial"
        };

        const frame0 = SceneTransitionSampler.sampleFrame(plan, 0);
        const sampledCartesian0 = frame0.scene as CartesianChartScene;
        expect((sampledCartesian0.series[0] as ChartBarSeriesScene).bars[0].height).toBe(0);

        const frameMid = SceneTransitionSampler.sampleFrame(plan, 0.5);
        const sampledCartesianMid = frameMid.scene as CartesianChartScene;
        expect(((sampledCartesianMid.series[0] as ChartBarSeriesScene).bars[0]).height).toBeCloseTo(50, 1);

        const frame1 = SceneTransitionSampler.sampleFrame(plan, 1);
        const sampledCartesian1 = frame1.scene as CartesianChartScene;
        expect((sampledCartesian1.series[0] as ChartBarSeriesScene).bars[0].height).toBe(100);
    });

    it("should sample polar sector slice scene correctly", () => {
        const toScene: PolarSectorChartScene = {
            center: { x: 250, y: 150 },
            coordinateSystem: "polar",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 300, width: 500, x: 0, y: 0 },
            polarKind: "sector",
            series: [
                {
                    center: { x: 250, y: 150 },
                    cornerRadius: 0,
                    fillMode: "solid",
                    formattedTotal: "100",
                    id: "pie1",
                    innerRadius: 0,
                    labelPosition: "outside",
                    name: "Pie",
                    outerRadius: 100,
                    padAngle: 0,
                    showLabels: false,
                    slices: [
                        {
                            animationKey: "pie1:s1",
                            category: "A",
                            centroid: { x: 250, y: 100 },
                            color: "#3b82f6",
                            cornerRadius: 0,
                            dataIndex: 0,
                            datum: {},
                            endAngle: Math.PI,
                            formattedCategory: "A",
                            formattedPercentage: "50%",
                            formattedValue: "50",
                            innerRadius: 0,
                            insideLabelBackgroundColor: "#3b82f6",
                            insideLabelPoint: { x: 250, y: 100 },
                            outerRadius: 100,
                            padAngle: 0,
                            percentage: 0.5,
                            sliceId: "s1",
                            startAngle: 0,
                            value: 50,
                            visible: true
                        }
                    ],
                    style: { fillOpacity: 1, strokeColor: "", strokeSource: "default", strokeWidth: 0 },
                    total: 100,
                    type: "pie"
                }
            ],
            width: 500
        };

        const adapter = new SectorSeriesAnimationAdapter();
        const seriesPlan = adapter.createPlan(null, toScene.series[0], {
            options: { data: true, duration: 400, easing: "linear", enabled: true, initial: true, visibility: true },
            plotRect: toScene.plotRect,
            trigger: "initial"
        });

        const plan: ChartTransitionPlan = {
            complexity: { independentMarks: 1, markCount: 1, pathCount: 0, pathPoints: 0, pointCount: 0, totalWeightedCost: 1 },
            duration: 400,
            easing: "linear",
            fromScene: null,
            mode: "morph",
            seriesPlans: [seriesPlan],
            toScene,
            trigger: "initial"
        };

        const frameMid = SceneTransitionSampler.sampleFrame(plan, 0.5);
        const sampledSectorMid = frameMid.scene as PolarSectorChartScene;
        const slice = sampledSectorMid.series[0].slices[0];
        expect(slice.startAngle).toBe(0);
        expect(slice.endAngle).toBeCloseTo(Math.PI / 2, 2);
    });
});
