import { describe, expect, it } from "vitest";
import type { ChartAreaSeriesScene, ChartBarSeriesScene, ChartLineSeriesScene } from "../../scene/cartesian-scene";
import type { ChartContinuousPolarSeriesScene, ChartRadarSeriesScene } from "../../scene/polar-axis-scene";
import type { ChartSectorSeriesScene } from "../../scene/polar-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { AreaSeriesAnimationAdapter } from "./area-animation-adapter";
import { AxisAnimationAdapter } from "./axis-animation-adapter";
import { BarSeriesAnimationAdapter } from "./bar-animation-adapter";
import { LineSeriesAnimationAdapter } from "./line-animation-adapter";
import { PolarSeriesAnimationAdapter } from "./polar-animation-adapter";
import { RadarSeriesAnimationAdapter } from "./radar-animation-adapter";
import { SectorSeriesAnimationAdapter } from "./sector-animation-adapter";

const mockStyle: ChartSeriesStyle = {
    areaFillColor: "#3b82f6",
    areaFillOpacity: 0.2,
    color: "#3b82f6",
    fillOpacity: 1,
    lineWidth: 2,
    opacity: 1,
    pointRadius: 4
};

describe("Series Animation Adapters", () => {
    describe("BarSeriesAnimationAdapter", () => {
        it("should animate initial entry from signed baseline", () => {
            const adapter = new BarSeriesAnimationAdapter();
            const toSeries: ChartBarSeriesScene = {
                bars: [
                    {
                        animationKey: "b:0",
                        datum: {},
                        height: 100,
                        index: 0,
                        isPositive: true,
                        radius: 4,
                        width: 20,
                        x: 50,
                        xValue: 0,
                        y: 100,
                        yValue: 10
                    },
                    {
                        animationKey: "b:1",
                        datum: {},
                        height: 60,
                        index: 1,
                        isPositive: false,
                        radius: 4,
                        width: 20,
                        x: 80,
                        xValue: 1,
                        y: 200,
                        yValue: -6
                    }
                ],
                borderRadius: 4,
                fillOpacity: 1,
                id: "b",
                name: "Bar",
                style: mockStyle,
                type: "bar",
                xAxisId: "default-x",
                yAxisId: "default-y"
            };

            const plan = adapter.createPlan(null, toSeries, {
                options: {
                    data: true,
                    duration: 400,
                    easing: "linear",
                    enabled: true,
                    initial: true,
                    visibility: true
                },
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                trigger: "initial"
            });

            const sampled0 = plan.sample(0);
            expect(sampled0?.bars[0].height).toBe(0);
            expect(sampled0?.bars[1].height).toBe(0);

            const sampledMid = plan.sample(0.5);
            expect(sampledMid?.bars[0].height).toBeCloseTo(50, 1);
            expect(sampledMid?.bars[1].height).toBeCloseTo(30, 1);

            const sampled1 = plan.sample(1);
            expect(sampled1?.bars[0].height).toBe(100);
            expect(sampled1?.bars[1].height).toBe(60);
        });

        it("should smoothly morph bars and interpolate cornerRadii when transitioning between vertical and horizontal", () => {
            const adapter = new BarSeriesAnimationAdapter();
            const fromVertical: ChartBarSeriesScene = {
                bars: [
                    {
                        animationKey: "b:0",
                        cornerRadii: { bottomLeft: 0, bottomRight: 0, topLeft: 4, topRight: 4 },
                        datum: {},
                        height: 100,
                        index: 0,
                        isPositive: true,
                        orientation: "vertical",
                        radius: 4,
                        width: 20,
                        x: 50,
                        xValue: 0,
                        y: 100,
                        yValue: 10
                    }
                ],
                borderRadius: 4,
                fillOpacity: 1,
                id: "b",
                name: "Bar",
                orientation: "vertical",
                style: mockStyle,
                type: "bar",
                xAxisId: "default-x",
                yAxisId: "default-y"
            };

            const toHorizontal: ChartBarSeriesScene = {
                bars: [
                    {
                        animationKey: "b:0",
                        cornerRadii: { bottomLeft: 0, bottomRight: 4, topLeft: 0, topRight: 4 },
                        datum: {},
                        height: 20,
                        index: 0,
                        isPositive: true,
                        orientation: "horizontal",
                        radius: 4,
                        width: 150,
                        x: 20,
                        xValue: 10,
                        y: 50,
                        yValue: 0
                    }
                ],
                borderRadius: 4,
                fillOpacity: 1,
                id: "b",
                name: "Bar",
                orientation: "horizontal",
                style: mockStyle,
                type: "bar",
                xAxisId: "default-x",
                yAxisId: "default-y"
            };

            const plan = adapter.createPlan(fromVertical, toHorizontal, {
                options: {
                    data: true,
                    duration: 400,
                    easing: "linear",
                    enabled: true,
                    initial: true,
                    visibility: true
                },
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                trigger: "data"
            });

            const sampledMid = plan.sample(0.5);
            expect(sampledMid).not.toBeNull();
            expect(sampledMid!.bars[0].x).toBeCloseTo(35, 1);
            expect(sampledMid!.bars[0].y).toBeCloseTo(75, 1);
            expect(sampledMid!.bars[0].width).toBeCloseTo(85, 1);
            expect(sampledMid!.bars[0].height).toBeCloseTo(60, 1);
            expect(sampledMid!.bars[0].cornerRadii?.topLeft).toBeCloseTo(2, 1);
            expect(sampledMid!.bars[0].cornerRadii?.topRight).toBeCloseTo(4, 1);
            expect(sampledMid!.bars[0].cornerRadii?.bottomRight).toBeCloseTo(2, 1);
            expect(sampledMid!.bars[0].cornerRadii?.bottomLeft).toBeCloseTo(0, 1);
        });
    });

    describe("LineSeriesAnimationAdapter", () => {
        it("should animate line vertices from baseline", () => {
            const adapter = new LineSeriesAnimationAdapter();
            const toSeries: ChartLineSeriesScene = {
                connectNulls: false,
                curve: "linear",
                id: "l",
                name: "Line",
                points: [
                    { animationKey: "l:0", datum: {}, defined: true, index: 0, x: 50, xValue: 0, y: 100, yValue: 10 },
                    { animationKey: "l:1", datum: {}, defined: true, index: 1, x: 150, xValue: 1, y: 150, yValue: 5 }
                ],
                showPoints: true,
                style: mockStyle,
                type: "line",
                xAxisId: "default-x",
                yAxisId: "default-y"
            };

            const plan = adapter.createPlan(null, toSeries, {
                options: {
                    data: true,
                    duration: 400,
                    easing: "linear",
                    enabled: true,
                    initial: true,
                    visibility: true
                },
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                trigger: "initial"
            });

            const sampled0 = plan.sample(0);
            expect(sampled0?.points[0].y).toBe(280); // baseline at bottom

            const sampled1 = plan.sample(1);
            expect(sampled1?.points[0].y).toBe(100);
        });
    });

    describe("AreaSeriesAnimationAdapter", () => {
        it("should animate area series points and preserve fillMode", () => {
            const adapter = new AreaSeriesAnimationAdapter();
            const toSeries: ChartAreaSeriesScene = {
                baselineY: 280,
                connectNulls: false,
                curve: "linear",
                fillMode: "gradient",
                fillOpacity: 0.2,
                id: "a",
                name: "Area",
                points: [
                    {
                        animationKey: "a:0",
                        baseY: 280,
                        datum: {},
                        defined: true,
                        index: 0,
                        x: 50,
                        xValue: 0,
                        y: 100,
                        yValue: 10
                    }
                ],
                showPoints: false,
                style: mockStyle,
                type: "area",
                xAxisId: "default-x",
                yAxisId: "default-y"
            };

            const plan = adapter.createPlan(null, toSeries, {
                options: {
                    data: true,
                    duration: 400,
                    easing: "linear",
                    enabled: true,
                    initial: true,
                    visibility: true
                },
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                trigger: "initial"
            });

            const sampledMid = plan.sample(0.5);
            expect(sampledMid?.points[0].y).toBeCloseTo(190, 1);
            expect(sampledMid?.fillMode).toBe("gradient");
        });
    });

    describe("SectorSeriesAnimationAdapter", () => {
        it("should expand pie slices from mid-angle on entry", () => {
            const adapter = new SectorSeriesAnimationAdapter();
            const toSeries: ChartSectorSeriesScene = {
                center: { x: 250, y: 150 },
                cornerRadius: 0,
                fillMode: "solid",
                formattedTotal: "100",
                id: "pie",
                innerRadius: 0,
                labelPosition: "outside",
                name: "Pie",
                outerRadius: 100,
                padAngle: 0,
                showLabels: false,
                slices: [
                    {
                        animationKey: "pie:0",
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
                        sliceId: "0",
                        startAngle: 0,
                        value: 50,
                        visible: true
                    }
                ],
                style: { fillOpacity: 1, strokeColor: "", strokeSource: "default", strokeWidth: 0 },
                total: 100,
                type: "pie"
            };

            const plan = adapter.createPlan(null, toSeries, {
                options: {
                    data: true,
                    duration: 400,
                    easing: "linear",
                    enabled: true,
                    initial: true,
                    visibility: true
                },
                trigger: "initial"
            });

            const sampled0 = plan.sample(0);
            expect(sampled0?.slices[0].startAngle).toBe(0);
            expect(sampled0?.slices[0].endAngle).toBe(0);

            const sampledMid = plan.sample(0.5);
            expect(sampledMid?.slices[0].startAngle).toBe(0);
            expect(sampledMid?.slices[0].endAngle).toBeCloseTo(Math.PI / 2, 2);

            const sampled1 = plan.sample(1);
            expect(sampled1?.slices[0].startAngle).toBe(0);
            expect(sampled1?.slices[0].endAngle).toBe(Math.PI);
        });
    });

    describe("RadarSeriesAnimationAdapter", () => {
        it("should expand radar series radial points from center (radius 0)", () => {
            const adapter = new RadarSeriesAnimationAdapter();
            const toSeries: ChartRadarSeriesScene = {
                color: "#3b82f6",
                connectNulls: false,
                curve: "linear",
                fillMode: "solid",
                fillOpacity: 0.2,
                id: "r",
                maxRenderedRadius: 100,
                name: "Radar",
                pointRadius: 4,
                points: [
                    {
                        angle: 0,
                        animationKey: "r:0",
                        category: "A",
                        dataIndex: 0,
                        datum: {},
                        defined: true,
                        formattedValue: "50",
                        point: { x: 250, y: 50 },
                        radius: 100,
                        value: 50
                    }
                ],
                showPoints: true,
                strokeWidth: 2,
                type: "radar"
            };

            const plan = adapter.createPlan(null, toSeries, {
                options: {
                    data: true,
                    duration: 400,
                    easing: "linear",
                    enabled: true,
                    initial: true,
                    visibility: true
                },
                trigger: "initial"
            });

            const sampled0 = plan.sample(0);
            expect(sampled0?.points[0].radius).toBe(0);

            const sampledMid = plan.sample(0.5);
            expect(sampledMid?.points[0].radius).toBe(50);

            const sampled1 = plan.sample(1);
            expect(sampled1?.points[0].radius).toBe(100);
        });
    });

    describe("PolarSeriesAnimationAdapter", () => {
        it("should expand polar series points from pole", () => {
            const adapter = new PolarSeriesAnimationAdapter();
            const toSeries: ChartContinuousPolarSeriesScene = {
                color: "#3b82f6",
                connectNulls: false,
                curve: "linear",
                fillMode: "gradient",
                fillOpacity: 0.2,
                id: "pol",
                maxRenderedRadius: 100,
                name: "Polar",
                pointRadius: 4,
                points: [
                    {
                        angle: 0,
                        animationKey: "pol:0",
                        dataIndex: 0,
                        datum: {},
                        defined: true,
                        formattedValue: "80",
                        point: { x: 250, y: 70 },
                        radius: 80,
                        value: 80
                    }
                ],
                showPoints: true,
                strokeWidth: 2,
                type: "polar"
            };

            const plan = adapter.createPlan(null, toSeries, {
                options: {
                    data: true,
                    duration: 400,
                    easing: "linear",
                    enabled: true,
                    initial: true,
                    visibility: true
                },
                trigger: "initial"
            });

            const sampled0 = plan.sample(0);
            expect(sampled0?.points[0].radius).toBe(0);

            const sampled1 = plan.sample(1);
            expect(sampled1?.points[0].radius).toBe(80);
        });
    });

    describe("AxisAnimationAdapter", () => {
        it("should interpolate cartesian tick coordinate positions", () => {
            const prevAxes = [
                {
                    axis: "x" as const,
                    axisLine: true,
                    gridLines: true,
                    position: "bottom" as const,
                    ticks: [{ coordinate: 100, formattedValue: "10", index: 0, value: 10 }],
                    title: "",
                    visible: true
                }
            ];
            const targetAxes = [
                {
                    axis: "x" as const,
                    axisLine: true,
                    gridLines: true,
                    position: "bottom" as const,
                    ticks: [{ coordinate: 200, formattedValue: "10", index: 0, value: 10 }],
                    title: "",
                    visible: true
                }
            ];

            const plan = AxisAnimationAdapter.createCartesianAxisPlan(prevAxes, targetAxes);
            const sampled = plan.sample(0.5);
            expect(sampled[0].ticks[0].coordinate).toBe(150);
        });

        it("does not pseudo-interpolate ticks across category and quantitative axis role swap during orientation morph (HAX-3-006)", () => {
            const prevAxes = [
                {
                    axis: "x" as const,
                    axisLine: true,
                    gridLines: true,
                    position: "bottom" as const,
                    ticks: [
                        { coordinate: 100, formattedValue: "Jan", index: 0, value: "Jan" },
                        { coordinate: 200, formattedValue: "Feb", index: 1, value: "Feb" }
                    ],
                    title: "",
                    visible: true
                },
                {
                    axis: "y" as const,
                    axisLine: true,
                    gridLines: true,
                    position: "left" as const,
                    ticks: [
                        { coordinate: 50, formattedValue: "0", index: 0, value: 0 },
                        { coordinate: 250, formattedValue: "100", index: 1, value: 100 }
                    ],
                    title: "",
                    visible: true
                }
            ];

            const targetAxes = [
                {
                    axis: "x" as const,
                    axisLine: true,
                    gridLines: true,
                    position: "bottom" as const,
                    ticks: [
                        { coordinate: 50, formattedValue: "0", index: 0, value: 0 },
                        { coordinate: 250, formattedValue: "100", index: 1, value: 100 }
                    ],
                    title: "",
                    visible: true
                },
                {
                    axis: "y" as const,
                    axisLine: true,
                    gridLines: true,
                    position: "left" as const,
                    ticks: [
                        { coordinate: 80, formattedValue: "Jan", index: 0, value: "Jan" },
                        { coordinate: 160, formattedValue: "Feb", index: 1, value: "Feb" }
                    ],
                    title: "",
                    visible: true
                }
            ];

            const plan = AxisAnimationAdapter.createCartesianAxisPlan(prevAxes, targetAxes);
            const sampled = plan.sample(0.5);

            // On X-axis (now numeric), tick values (0, 100) did not match previous X category strings ("Jan", "Feb"),
            // so target ticks take their target coordinates directly without spurious coordinate interpolation.
            expect(sampled[0].ticks[0].coordinate).toBe(50);
            expect(sampled[0].ticks[1].coordinate).toBe(250);

            // On Y-axis (now category), tick values ("Jan", "Feb") did not match previous Y numeric values (0, 100),
            // so target ticks take their target coordinates directly.
            expect(sampled[1].ticks[0].coordinate).toBe(80);
            expect(sampled[1].ticks[1].coordinate).toBe(160);
        });
    });
});
