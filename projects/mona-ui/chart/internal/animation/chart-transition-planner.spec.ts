import { describe, expect, it } from "vitest";
import type { CartesianXYChartScene, PolarSectorChartScene } from "../scene/chart-scene";
import type { ChartLineSeriesScene, ChartSeriesScene } from "../scene/cartesian-scene";
import type { PolarArcChartScene } from "../scene/polar-arc-scene";
import { normalizeChartAnimationOptions } from "./chart-animation-options";
import { ChartTransitionPlanner } from "./chart-transition-planner";

function createMockCartesianSceneWithBars(): CartesianXYChartScene {
    return {
        axes: [],
        cartesianKind: "xy",
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
                style: {
                    areaFillColor: "#3b82f6",
                    areaFillOpacity: 0.2,
                    color: "#3b82f6",
                    fillOpacity: 1,
                    lineWidth: 2,
                    opacity: 1,
                    pointRadius: 4
                },
                type: "bar",
                xAxisId: "default-x",
                yAxisId: "default-y"
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

    it("should fallback to crossfade when line series path topology is incompatible (e.g. point count change)", () => {
        const lineSeriesPrev: ChartLineSeriesScene = {
            connectNulls: false,
            curve: "linear",
            id: "line1",
            name: "Line",
            points: [
                { animationKey: "line1:p0", datum: {}, defined: true, index: 0, x: 10, xValue: 0, y: 50, yValue: 50 },
                { animationKey: "line1:p1", datum: {}, defined: true, index: 1, x: 20, xValue: 1, y: 60, yValue: 60 }
            ],
            showPoints: true,
            style: {
                areaFillColor: "",
                areaFillOpacity: 0,
                color: "#3b82f6",
                fillOpacity: 1,
                lineWidth: 2,
                opacity: 1,
                pointRadius: 4
            },
            type: "line",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        const prev: CartesianXYChartScene = {
            axes: [],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 260, width: 460, x: 20, y: 20 },
            series: [lineSeriesPrev],
            width: 500
        };

        const lineSeriesNext: ChartLineSeriesScene = {
            ...lineSeriesPrev,
            points: [
                { animationKey: "line1:p0", datum: {}, defined: true, index: 0, x: 10, xValue: 0, y: 50, yValue: 50 },
                { animationKey: "line1:p1", datum: {}, defined: true, index: 1, x: 20, xValue: 1, y: 60, yValue: 60 },
                { animationKey: "line1:p2", datum: {}, defined: true, index: 2, x: 30, xValue: 2, y: 70, yValue: 70 }
            ]
        };

        const next: CartesianXYChartScene = {
            ...prev,
            series: [lineSeriesNext]
        };

        const options = normalizeChartAnimationOptions(true);
        const plan = ChartTransitionPlanner.plan(prev, next, "data", options);

        expect(plan.mode).toBe("crossfade");
    });

    it("should fallback to crossfade when series changes type (e.g. candlestick to ohlc) (FIN2-019)", () => {
        const candleSeries = {
            bodyWidth: 20,
            bodyWidthRatio: 0.7,
            fillMode: "filled" as const,
            id: "fin1",
            marks: [],
            maxBodyWidth: 32,
            name: "Fin",
            style: { fallingColor: "#ef4444", neutralColor: "#6b7280", risingColor: "#22c55e", wickWidth: 1 },
            type: "candlestick" as const,
            wickWidth: 1
        };

        const ohlcSeries = {
            bodyWidth: 20,
            bodyWidthRatio: 0.7,
            id: "fin1",
            marks: [],
            maxBodyWidth: 32,
            name: "Fin",
            style: { fallingColor: "#ef4444", neutralColor: "#6b7280", risingColor: "#22c55e", wickWidth: 1 },
            type: "ohlc" as const,
            wickWidth: 1
        };

        const prev: CartesianXYChartScene = {
            axes: [],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 260, width: 460, x: 20, y: 20 },
            series: [candleSeries as unknown as ChartSeriesScene],
            width: 500
        };

        const next: CartesianXYChartScene = {
            ...prev,
            series: [ohlcSeries as unknown as ChartSeriesScene]
        };

        const options = normalizeChartAnimationOptions(true);
        const plan = ChartTransitionPlanner.plan(prev, next, "data", options);

        expect(plan.mode).toBe("crossfade");
    });

    it("should crossfade when Rose angular topology changes (PRE-TM-009)", () => {
        const createRoseScene = (cats: string[], rotation = 0) =>
            ({
                angularAxis: {
                    axisLine: true,
                    gridLines: true,
                    labelOffset: 8,
                    labels: true,
                    mode: "category",
                    rotation,
                    ticks: [],
                    visible: true
                },
                arcMode: "rose",
                center: { x: 200, y: 200 },
                coordinateSystem: "polar",
                hasRenderableData: true,
                height: 400,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                outerRadius: 150,
                plotRect: { height: 400, width: 400, x: 0, y: 0 },
                polarKind: "arc",
                series: [
                    {
                        angularCategories: cats.map((c, i) => ({
                            category: c,
                            categoryKey: `k:${c}`,
                            endAngle: (i + 1) * 0.5,
                            formattedCategory: c,
                            index: i,
                            midAngle: (i + 0.5) * 0.5,
                            startAngle: i * 0.5
                        })),
                        fillMode: "solid",
                        id: "rose-1",
                        marks: [],
                        name: "Rose",
                        scaleMode: "radius",
                        style: {
                            color: "#3b82f6",
                            fillOpacity: 0.8,
                            strokeColor: "",
                            strokeSource: "default",
                            strokeWidth: 0,
                            trackColor: "",
                            trackOpacity: 1
                        },
                        type: "rose"
                    }
                ],
                width: 400
            }) as unknown as PolarArcChartScene;

        const prev = createRoseScene(["N", "E", "S", "W"], 0);
        const nextDiffCats = createRoseScene(["N", "E", "S", "W", "NW"], 0);
        const options = normalizeChartAnimationOptions(true);

        const planCats = ChartTransitionPlanner.plan(prev, nextDiffCats, "data", options);
        expect(planCats.mode).toBe("crossfade");

        const nextDiffRot = createRoseScene(["N", "E", "S", "W"], 45);
        const planRot = ChartTransitionPlanner.plan(prev, nextDiffRot, "data", options);
        expect(planRot.mode).toBe("crossfade");
    });

    describe("Bar & RangeBar Orientation Switching", () => {
        it("should plan morph transition when switching Bar series orientation between vertical and horizontal", () => {
            const prevVertical = createMockCartesianSceneWithBars();
            prevVertical.orientation = "vertical";
            prevVertical.xAxisType = "category";
            prevVertical.yAxisType = "linear";

            const nextHorizontal: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 300,
                hitTargets: [
                    {
                        animationKey: "b1:catA",
                        barOrientation: "horizontal",
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
                orientation: "horizontal",
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                series: [
                    {
                        bars: [
                            {
                                animationKey: "b1:catA",
                                datum: {},
                                height: 20,
                                index: 0,
                                isPositive: true,
                                orientation: "horizontal",
                                radius: 4,
                                width: 150,
                                x: 20,
                                xValue: "catA",
                                y: 50,
                                yValue: 10
                            }
                        ],
                        borderRadius: 4,
                        fillOpacity: 1,
                        id: "b1",
                        name: "Bar 1",
                        orientation: "horizontal",
                        style: {
                            areaFillColor: "#3b82f6",
                            areaFillOpacity: 0.2,
                            color: "#3b82f6",
                            fillOpacity: 1,
                            lineWidth: 2,
                            opacity: 1,
                            pointRadius: 4
                        },
                        type: "bar",
                        xAxisId: "default-x",
                        yAxisId: "default-y"
                    }
                ],
                width: 500,
                xAxisType: "linear",
                yAxisType: "category"
            };

            const options = normalizeChartAnimationOptions(true);
            const plan = ChartTransitionPlanner.plan(prevVertical, nextHorizontal, "data", options);

            expect(plan.mode).toBe("morph");
            expect(plan.seriesPlans.length).toBe(1);
            expect(plan.seriesPlans[0].adapterType).toBe("bar");
        });

        it("should plan morph transition when switching Bar orientation even with axisTopologySignature and stackSignature present", () => {
            const prevVertical = createMockCartesianSceneWithBars();
            prevVertical.orientation = "vertical";
            prevVertical.xAxisType = "category";
            prevVertical.yAxisType = "linear";
            prevVertical.axisTopologySignature = "axis:x,bottom,category;axis:y,left,linear";
            prevVertical.stackSignature = "v-group";

            const nextHorizontal: CartesianXYChartScene = {
                axes: [],
                axisTopologySignature: "axis:x,bottom,linear;axis:y,left,category",
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 300,
                hitTargets: [
                    {
                        animationKey: "b1:catA",
                        barOrientation: "horizontal",
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
                orientation: "horizontal",
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                series: [
                    {
                        bars: [
                            {
                                animationKey: "b1:catA",
                                datum: {},
                                height: 20,
                                index: 0,
                                isPositive: true,
                                orientation: "horizontal",
                                radius: 4,
                                width: 150,
                                x: 20,
                                xValue: "catA",
                                y: 50,
                                yValue: 10
                            }
                        ],
                        borderRadius: 4,
                        fillOpacity: 1,
                        id: "b1",
                        name: "Bar 1",
                        orientation: "horizontal",
                        style: {
                            areaFillColor: "#3b82f6",
                            areaFillOpacity: 0.2,
                            color: "#3b82f6",
                            fillOpacity: 1,
                            lineWidth: 2,
                            opacity: 1,
                            pointRadius: 4
                        },
                        type: "bar",
                        xAxisId: "default-x",
                        yAxisId: "default-y"
                    }
                ],
                stackSignature: "h-group",
                width: 500,
                xAxisType: "linear",
                yAxisType: "category"
            };

            const options = normalizeChartAnimationOptions(true);
            const plan = ChartTransitionPlanner.plan(prevVertical, nextHorizontal, "data", options);

            expect(plan.mode).toBe("morph");
            expect(plan.seriesPlans.length).toBe(1);
            expect(plan.seriesPlans[0].adapterType).toBe("bar");
        });

        it("should fallback to crossfade when orientation switches with incompatible series type (e.g. Line)", () => {
            const prevVertical: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                orientation: "vertical",
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                series: [
                    {
                        connectNulls: false,
                        curve: "linear",
                        id: "l1",
                        name: "Line 1",
                        points: [
                            {
                                animationKey: "p0",
                                datum: {},
                                defined: true,
                                index: 0,
                                x: 10,
                                xValue: 0,
                                y: 50,
                                yValue: 50
                            }
                        ],
                        showPoints: true,
                        style: {
                            areaFillColor: "",
                            areaFillOpacity: 0,
                            color: "#3b82f6",
                            fillOpacity: 1,
                            lineWidth: 2,
                            opacity: 1,
                            pointRadius: 4
                        },
                        type: "line",
                        xAxisId: "default-x",
                        yAxisId: "default-y"
                    }
                ],
                width: 500,
                xAxisType: "category",
                yAxisType: "linear"
            };

            const nextHorizontal: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                orientation: "horizontal",
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                series: [
                    {
                        connectNulls: false,
                        curve: "linear",
                        id: "l1",
                        name: "Line 1",
                        points: [
                            {
                                animationKey: "p0",
                                datum: {},
                                defined: true,
                                index: 0,
                                x: 50,
                                xValue: 50,
                                y: 10,
                                yValue: 0
                            }
                        ],
                        showPoints: true,
                        style: {
                            areaFillColor: "",
                            areaFillOpacity: 0,
                            color: "#3b82f6",
                            fillOpacity: 1,
                            lineWidth: 2,
                            opacity: 1,
                            pointRadius: 4
                        },
                        type: "line",
                        xAxisId: "default-x",
                        yAxisId: "default-y"
                    }
                ],
                width: 500,
                xAxisType: "linear",
                yAxisType: "category"
            };

            const options = normalizeChartAnimationOptions(true);
            const plan = ChartTransitionPlanner.plan(prevVertical, nextHorizontal, "data", options);

            expect(plan.mode).toBe("crossfade");
        });
    });

    describe("Multi-Axis Topology & Re-binding Transitions (MAXR-025, MAXR-026)", () => {
        it("should fallback to crossfade when Cartesian axisTopologySignature changes (MAXR-025)", () => {
            const prev = createMockCartesianSceneWithBars();
            prev.axisTopologySignature = "sig-1-axis";

            const next = createMockCartesianSceneWithBars();
            next.axisTopologySignature = "sig-2-axes";

            const options = normalizeChartAnimationOptions(true);
            const plan = ChartTransitionPlanner.plan(prev, next, "data", options);

            expect(plan.mode).toBe("crossfade");
        });

        it("should fallback to crossfade when a series is rebound to a different axis (MAXR-026)", () => {
            const baseScene = createMockCartesianSceneWithBars();
            const prev: CartesianXYChartScene = {
                ...baseScene,
                series: [{ ...baseScene.series[0], xAxisId: "x-primary", yAxisId: "y-left" }]
            };

            const next: CartesianXYChartScene = {
                ...baseScene,
                series: [{ ...baseScene.series[0], xAxisId: "x-primary", yAxisId: "y-right" }] // Rebound from y-left to y-right
            };

            const options = normalizeChartAnimationOptions(true);
            const plan = ChartTransitionPlanner.plan(prev, next, "data", options);

            expect(plan.mode).toBe("crossfade");
        });
    });
});
