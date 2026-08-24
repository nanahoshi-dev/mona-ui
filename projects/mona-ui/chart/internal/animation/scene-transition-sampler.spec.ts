import { describe, expect, it } from "vitest";
import type {
    CartesianFunnelChartScene,
    CartesianWaterfallChartScene,
    CartesianXYChartScene,
    PolarSectorChartScene
} from "../scene/chart-scene";
import type { ChartBarSeriesScene } from "../scene/cartesian-scene";
import type { ChartRadialBarSeriesScene, PolarArcChartScene } from "../scene/polar-arc-scene";
import { BarSeriesAnimationAdapter } from "./adapters/bar-animation-adapter";
import { FinancialSeriesAnimationAdapter } from "./adapters/financial-animation-adapter";
import { FunnelAnimationAdapter } from "./adapters/funnel-animation-adapter";
import { RadialArcAnimationAdapter } from "./adapters/radial-arc-animation-adapter";
import { SectorSeriesAnimationAdapter } from "./adapters/sector-animation-adapter";
import { WaterfallAnimationAdapter } from "./adapters/waterfall-animation-adapter";
import { FunnelHitIndex } from "../interaction/funnel-hit-index";
import { WaterfallHitIndex } from "../interaction/waterfall-hit-index";
import { SceneTransitionSampler } from "./scene-transition-sampler";
import type { ChartTransitionPlan } from "./chart-transition-types";

describe("SceneTransitionSampler", () => {
    it("should sample cartesian bar scene at progress 0, 0.5, and 1", () => {
        const toScene: CartesianXYChartScene = {
            axes: [],
            cartesianKind: "xy",
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
            stackConfiguration: [
                {
                    geometryType: "bar",
                    groupId: "bar:sales",
                    mode: "normal",
                    registeredSeriesIds: ["b1"]
                }
            ],
            stackSignature: '["bar:sales"]',
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
            complexity: {
                independentMarks: 1,
                markCount: 1,
                pathCount: 0,
                pathPoints: 0,
                pointCount: 0,
                totalWeightedCost: 1
            },
            duration: 400,
            easing: "linear",
            fromScene: null,
            mode: "morph",
            seriesPlans: [seriesPlan],
            toScene,
            trigger: "initial"
        };

        const frame0 = SceneTransitionSampler.sampleFrame(plan, 0);
        const sampledCartesian0 = frame0.scene as CartesianXYChartScene;
        expect((sampledCartesian0.series[0] as ChartBarSeriesScene).bars[0].height).toBe(0);
        expect(sampledCartesian0.stackConfiguration).toEqual(toScene.stackConfiguration);
        expect(sampledCartesian0.stackSignature).toBe(toScene.stackSignature);

        const frameMid = SceneTransitionSampler.sampleFrame(plan, 0.5);
        const sampledCartesianMid = frameMid.scene as CartesianXYChartScene;
        expect((sampledCartesianMid.series[0] as ChartBarSeriesScene).bars[0].height).toBeCloseTo(50, 1);
        expect(sampledCartesianMid.stackConfiguration).toEqual(toScene.stackConfiguration);
        expect(sampledCartesianMid.stackSignature).toBe(toScene.stackSignature);

        const frame1 = SceneTransitionSampler.sampleFrame(plan, 1);
        const sampledCartesian1 = frame1.scene as CartesianXYChartScene;
        expect((sampledCartesian1.series[0] as ChartBarSeriesScene).bars[0].height).toBe(100);
        expect(sampledCartesian1.stackConfiguration).toEqual(toScene.stackConfiguration);
        expect(sampledCartesian1.stackSignature).toBe(toScene.stackSignature);
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
            complexity: {
                independentMarks: 1,
                markCount: 1,
                pathCount: 0,
                pathPoints: 0,
                pointCount: 0,
                totalWeightedCost: 1
            },
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

    it("should sample financial candlestick scene with sampledFinancialIndex and accurate bounds (FIN2-003, FIN2-005)", () => {
        const candlestickMark = {
            animationKey: "k1",
            bodyBounds: { height: 40, width: 20, x: 90, y: 60 },
            bodyWidth: 20,
            centerX: 100,
            close: 110,
            closeY: 60,
            datum: { id: 1 },
            direction: "rising" as const,
            fillMode: "filled" as const,
            high: 120,
            highY: 50,
            index: 0,
            low: 90,
            lowY: 100,
            open: 100,
            openY: 100,
            wickWidth: 1,
            xValue: "Jan"
        };

        const candlestickScene: CartesianXYChartScene = {
            axes: [],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [
                {
                    animationKey: "k1",
                    bounds: { height: 50, width: 20, x: 90, y: 50 },
                    close: 110,
                    datum: { id: 1 },
                    high: 120,
                    index: 0,
                    low: 90,
                    open: 100,
                    seriesId: "fin1",
                    seriesName: "Candles",
                    seriesType: "candlestick",
                    valueKind: "ohlc",
                    visualBounds: { height: 50, width: 20, x: 90, y: 50 },
                    xKey: "Jan",
                    xValue: "Jan"
                }
            ],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 260, width: 460, x: 20, y: 20 },
            series: [
                {
                    bodyWidth: 20,
                    fillMode: "filled",
                    id: "fin1",
                    marks: [candlestickMark],
                    maxBodyWidth: 32,
                    name: "Candles",
                    style: { fallingColor: "#ef4444", neutralColor: "#6b7280", risingColor: "#22c55e", wickWidth: 1 },
                    type: "candlestick",
                    wickWidth: 1,
                    xAxisId: "default-x",
                    yAxisId: "default-y"
                }
            ],
            width: 500
        };

        const adapter = new FinancialSeriesAnimationAdapter();
        const seriesPlan = adapter.createPlan(null, candlestickScene.series[0], {
            options: { data: true, duration: 400, easing: "linear", enabled: true, initial: true, visibility: true },
            plotRect: candlestickScene.plotRect,
            trigger: "initial"
        });

        const plan: ChartTransitionPlan = {
            complexity: {
                independentMarks: 1,
                markCount: 1,
                pathCount: 0,
                pathPoints: 0,
                pointCount: 0,
                totalWeightedCost: 1
            },
            duration: 400,
            easing: "linear",
            fromScene: null,
            mode: "morph",
            seriesPlans: [seriesPlan],
            toScene: candlestickScene,
            trigger: "initial"
        };

        const frameMid = SceneTransitionSampler.sampleFrame(plan, 0.5);
        const sampled = frameMid.scene as CartesianXYChartScene;

        expect(sampled.financialIndex).toBeDefined();
        expect(sampled.pointSpatialIndex).toBeUndefined();
        expect(sampled.hitTargets).toHaveLength(1);
        expect(sampled.hitTargets[0].valueKind).toBe("ohlc");
        expect(sampled.hitTargets[0].open).toBe(100);
        expect(sampled.hitTargets[0].close).toBe(110);
        expect(sampled.hitTargets[0].financial?.change).toBe(10);
        expect(sampled.hitTargets[0].financial?.changePercentage).toBeCloseTo(0.1);
    });

    it("should sample radial bar scene correctly at progress 0.5 without squared opacity", () => {
        const toScene = {
            arcMode: "radialBar",
            center: { x: 200, y: 200 },
            coordinateSystem: "polar",
            hasRenderableData: true,
            height: 400,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 400, width: 400, x: 0, y: 0 },
            polarKind: "arc",
            series: [
                {
                    barGap: 4,
                    fillMode: "solid",
                    id: "rb-1",
                    marks: [
                        {
                            animationKey: "rb-1:k1",
                            category: "A",
                            color: "#3b82f6",
                            cornerRadius: 0,
                            dataIndex: 0,
                            datum: {},
                            endAngle: Math.PI,
                            formattedCategory: "A",
                            formattedValue: "50",
                            innerRadius: 50,
                            itemId: "rb-1:k1",
                            normalizedValue: 0.5,
                            outerRadius: 80,
                            padAngle: 0,
                            rawValue: 50,
                            renderOpacity: 1,
                            startAngle: 0,
                            visible: true
                        }
                    ],
                    name: "RadialBar",
                    renderOpacity: 1,
                    style: {
                        color: "#3b82f6",
                        fillOpacity: 0.9,
                        strokeColor: "",
                        strokeSource: "default",
                        strokeWidth: 0,
                        trackColor: "",
                        trackOpacity: 1
                    },
                    tracks: [],
                    type: "radialBar"
                }
            ],
            width: 400
        } as unknown as PolarArcChartScene;

        const adapter = new RadialArcAnimationAdapter();
        const seriesPlan = adapter.createPlan(null, toScene.series[0], {
            options: { data: true, duration: 400, easing: "linear", enabled: true, initial: true, visibility: true },
            plotRect: toScene.plotRect,
            trigger: "initial"
        });

        const plan: ChartTransitionPlan = {
            complexity: {
                independentMarks: 1,
                markCount: 1,
                pathCount: 0,
                pathPoints: 0,
                pointCount: 0,
                totalWeightedCost: 1
            },
            duration: 400,
            easing: "linear",
            fromScene: null,
            mode: "morph",
            seriesPlans: [seriesPlan],
            toScene,
            trigger: "initial"
        };

        const frameMid = SceneTransitionSampler.sampleFrame(plan, 0.5);
        const sampled = frameMid.scene as PolarArcChartScene;
        const radialBarSeries = sampled.series[0] as ChartRadialBarSeriesScene;
        expect(radialBarSeries.renderOpacity).toBe(1);
        expect(radialBarSeries.marks[0].renderOpacity).toBeCloseTo(0.5, 2);
    });

    it("should sample waterfall scene and query sampled geometry without target-slot bias (FWF-C10)", () => {
        const plotRect = { height: 300, width: 400, x: 50, y: 50 };
        const fromBarC = {
            animationKey: "wf:C",
            barEnd: 150,
            barStart: 100,
            borderRadius: 0,
            bounds: { height: 100, width: 60, x: 270, y: 100 },
            category: "C",
            color: "#10b981",
            cumulativeAfter: 150,
            cumulativeBefore: 100,
            dataIndex: 2,
            datum: {},
            formattedCategory: "C",
            formattedCumulativeAfter: "150",
            formattedCumulativeBefore: "100",
            formattedValue: "+50",
            fromY: 200,
            itemId: "C",
            kind: "change" as const,
            renderOpacity: 1,
            renderOrder: 2,
            toY: 100,
            visualKind: "increase" as const
        };

        const toBarC = {
            ...fromBarC,
            bounds: { height: 100, width: 60, x: 170, y: 100 },
            renderOrder: 1
        };

        const toHitTargetC = {
            animationKey: "wf:C",
            bounds: toBarC.bounds,
            category: "C",
            color: "#10b981",
            dataIndex: 1,
            datum: {},
            formattedCategory: "C",
            formattedValue: "+50",
            fromValue: 100,
            index: 1,
            isPositive: true,
            itemId: "C",
            point: { x: 200, y: 150 },
            renderOrder: 1,
            seriesId: "wf1",
            seriesName: "Cashflow",
            seriesType: "waterfall" as const,
            toValue: 150,
            value: 50,
            valueKind: "waterfall" as const,
            visualBounds: toBarC.bounds,
            xKey: "C",
            xValue: "C",
            yValue: 150
        };

        const fromScene: CartesianWaterfallChartScene = {
            axes: [],
            cartesianKind: "waterfall",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 400,
            hitIndex: new WaterfallHitIndex({ entries: [], plotRect }),
            hitTargets: [],
            interactionBuckets: [],
            kindSignature: "change:increase",
            legendItems: [],
            plotRect,
            sequenceSignature: '["wf:C"]',
            series: [
                {
                    bars: [fromBarC],
                    connectors: [],
                    id: "wf1",
                    kindSignature: "change:increase",
                    labels: [],
                    name: "Cashflow",
                    renderOpacity: 1,
                    sequenceSignature: '["wf:C"]',
                    style: {
                        borderRadius: 0,
                        connectorColor: "#000",
                        connectorWidth: 1,
                        decreaseColor: "#ef4444",
                        fillOpacity: 1,
                        increaseColor: "#10b981",
                        neutralColor: "#6b7280",
                        strokeColor: "",
                        strokeWidth: 0,
                        subtotalColor: "#3b82f6",
                        totalColor: "#3b82f6"
                    },
                    type: "waterfall"
                }
            ],
            width: 500,
            xAxisType: "category"
        };

        const toScene: CartesianWaterfallChartScene = {
            ...fromScene,
            hitTargets: [toHitTargetC],
            series: [
                {
                    ...fromScene.series[0],
                    bars: [toBarC]
                }
            ]
        };

        const adapter = new WaterfallAnimationAdapter();
        const seriesPlan = adapter.createPlan(fromScene.series[0], toScene.series[0], {
            options: { data: true, duration: 400, easing: "linear", enabled: true, initial: false, visibility: true },
            plotRect,
            trigger: "data"
        });

        const plan: ChartTransitionPlan = {
            complexity: {
                independentMarks: 1,
                markCount: 1,
                pathCount: 0,
                pathPoints: 0,
                pointCount: 0,
                totalWeightedCost: 1
            },
            duration: 400,
            easing: "linear",
            fromScene,
            mode: "morph",
            seriesPlans: [seriesPlan],
            toScene,
            trigger: "data"
        };

        const frameMid = SceneTransitionSampler.sampleFrame(plan, 0.5);
        const sampled = frameMid.scene as CartesianWaterfallChartScene;
        const sampledBarC = sampled.series[0].bars[0];

        // 1. Sampled C bounds lie between previous (x=270) and target (x=170), so x=220
        expect(sampledBarC.bounds.x).toBeCloseTo(220, 1);

        // 2. Query sampled C center returns C
        const sampledCenter = {
            x: sampledBarC.bounds.x + sampledBarC.bounds.width / 2,
            y: sampledBarC.bounds.y + sampledBarC.bounds.height / 2
        };
        const nearestAtSampledCenter = sampled.hitIndex.query(sampledCenter);
        expect(nearestAtSampledCenter).not.toBeNull();
        expect(nearestAtSampledCenter?.itemId).toBe("C");

        // 3. Query final target location (x=200, outside sampled bounds x=220..280) does NOT hit C
        const nearestAtTargetLocation = sampled.hitIndex.query({ x: 180, y: 150 });
        expect(nearestAtTargetLocation).toBeNull();
    });

    it("should sample funnel scene and query sampled geometry without target-slot bias (FWF-C10)", () => {
        const plotRect = { height: 300, width: 400, x: 50, y: 50 };
        const fromStage = {
            animationKey: "fn:signups",
            bounds: { height: 80, width: 200, x: 150, y: 200 },
            category: "Signups",
            dataIndex: 2,
            datum: {},
            fillColor: "#3b82f6",
            formattedCategory: "Signups",
            formattedValue: "100",
            polygon: [
                { x: 150, y: 200 },
                { x: 350, y: 200 },
                { x: 320, y: 280 },
                { x: 180, y: 280 }
            ] as const,
            renderOpacity: 1,
            renderOrder: 2,
            sourceIndex: 2,
            stageId: "signups",
            stageIndex: 2,
            textColor: "#ffffff",
            value: 100
        };

        const toStage = {
            ...fromStage,
            bounds: { height: 80, width: 200, x: 150, y: 100 },
            polygon: [
                { x: 150, y: 100 },
                { x: 350, y: 100 },
                { x: 320, y: 180 },
                { x: 180, y: 180 }
            ] as const,
            renderOrder: 1,
            stageIndex: 1
        };

        const toHitTarget = {
            animationKey: "fn:signups",
            bounds: toStage.bounds,
            category: "Signups",
            color: "#3b82f6",
            dataIndex: 1,
            datum: {},
            formattedCategory: "Signups",
            formattedValue: "100",
            index: 1,
            isPositive: true,
            itemId: "signups",
            point: { x: 250, y: 140 },
            renderOrder: 1,
            seriesId: "fn1",
            seriesName: "Pipeline",
            seriesType: "funnel" as const,
            value: 100,
            valueKind: "scalar" as const,
            visualBounds: toStage.bounds,
            xKey: "signups",
            xValue: "Signups",
            yValue: 100
        };

        const fromScene: CartesianFunnelChartScene = {
            axes: [],
            cartesianKind: "funnel",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 400,
            hitIndex: new FunnelHitIndex({ entries: [], gap: 2, orientation: "vertical", plotRect, slotSpan: 80 }),
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
            plotRect,
            sequenceSignature: '["fn:signups"]',
            series: [
                {
                    id: "fn1",
                    labels: [],
                    name: "Pipeline",
                    orientation: "vertical",
                    renderOpacity: 1,
                    sequenceSignature: '["fn:signups"]',
                    stages: [fromStage],
                    style: { baseColor: "#3b82f6", fillOpacity: 1, strokeColor: "", strokeWidth: 0 },
                    type: "funnel"
                }
            ],
            width: 500
        };

        const toScene: CartesianFunnelChartScene = {
            ...fromScene,
            hitTargets: [toHitTarget],
            series: [
                {
                    ...fromScene.series[0],
                    stages: [toStage]
                }
            ]
        };

        const adapter = new FunnelAnimationAdapter();
        const seriesPlan = adapter.createPlan(fromScene.series[0], toScene.series[0], {
            options: { data: true, duration: 400, easing: "linear", enabled: true, initial: false, visibility: true },
            plotRect,
            trigger: "data"
        });

        const plan: ChartTransitionPlan = {
            complexity: {
                independentMarks: 1,
                markCount: 1,
                pathCount: 0,
                pathPoints: 0,
                pointCount: 0,
                totalWeightedCost: 1
            },
            duration: 400,
            easing: "linear",
            fromScene,
            mode: "morph",
            seriesPlans: [seriesPlan],
            toScene,
            trigger: "data"
        };

        const frameMid = SceneTransitionSampler.sampleFrame(plan, 0.5);
        const sampled = frameMid.scene as CartesianFunnelChartScene;
        const sampledStage = sampled.series[0].stages[0];

        // 1. Sampled polygon y positions lie halfway: y was 200..280, target 100..180 -> sampled is 150..230
        expect(sampledStage.polygon[0].y).toBeCloseTo(150, 1);
        expect(sampledStage.polygon[2].y).toBeCloseTo(230, 1);

        // 2. Query sampled center returns stage
        const sampledCenter = { x: 250, y: 190 };
        const nearestAtSampledCenter = sampled.hitIndex.query(sampledCenter);
        expect(nearestAtSampledCenter).not.toBeNull();
        expect(nearestAtSampledCenter?.itemId).toBe("signups");

        // 3. Query target-only location (y=110, outside sampled polygon y=150..230) does NOT hit
        const nearestAtTargetLocation = sampled.hitIndex.query({ x: 250, y: 110 });
        expect(nearestAtTargetLocation).toBeNull();
    });
});
