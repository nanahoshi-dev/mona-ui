import { describe, expect, it } from "vitest";
import type { CartesianChartScene, PolarSectorChartScene } from "../scene/chart-scene";
import { normalizeChartAnimationOptions } from "./chart-animation-options";
import { ChartTransitionPlanner } from "./chart-transition-planner";

function createMockCartesianSceneWithBars(): CartesianChartScene {
    return {
        axes: [],
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [
            {
                animationKey: "b1:catA",
                datum: {},
                index: 0,
                seriesId: "b1",
                seriesName: "Bar 1",
                seriesType: "bar",
                xKey: "catA",
                xValue: "catA",
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
                        animationKey: "b1:catA",
                        datum: {},
                        height: 100,
                        index: 0,
                        isPositive: true,
                        radius: 4,
                        width: 20,
                        x: 50,
                        xValue: "catA",
                        y: 100,
                        yValue: 10
                    }
                ],
                borderRadius: 4,
                fillOpacity: 1,
                id: "b1",
                name: "Bar 1",
                style: { areaFillColor: "#3b82f6", areaFillOpacity: 0.2, color: "#3b82f6", fillOpacity: 1, lineWidth: 2, opacity: 1, pointRadius: 4 },
                type: "bar"
            }
        ],
        width: 500
    };
}

function createMockSectorScene(): PolarSectorChartScene {
    return {
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
                name: "Pie 1",
                outerRadius: 100,
                padAngle: 0,
                showLabels: false,
                slices: [
                    {
                        animationKey: "pie1:sliceA",
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
                        sliceId: "sliceA",
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
}

describe("ChartTransitionPlanner", () => {
    it("should return immediate mode when animation is disabled", () => {
        const target = createMockCartesianSceneWithBars();
        const options = normalizeChartAnimationOptions(false);
        const plan = ChartTransitionPlanner.plan(null, target, "initial", options);

        expect(plan.mode).toBe("immediate");
        expect(plan.duration).toBe(0);
    });

    it("should plan morph transition for valid series", () => {
        const target = createMockCartesianSceneWithBars();
        const options = normalizeChartAnimationOptions(true);
        const plan = ChartTransitionPlanner.plan(null, target, "initial", options);

        expect(plan.mode).toBe("morph");
        expect(plan.duration).toBe(300);
        expect(plan.seriesPlans.length).toBe(1);
        expect(plan.seriesPlans[0].id).toBe("b1");
    });

    it("should fallback to crossfade when coordinate systems mismatch", () => {
        const prev = createMockCartesianSceneWithBars();
        const target = createMockSectorScene();
        const options = normalizeChartAnimationOptions(true);
        const plan = ChartTransitionPlanner.plan(prev, target, "data", options);

        expect(plan.mode).toBe("crossfade");
        expect(plan.duration).toBe(300);
    });
});
