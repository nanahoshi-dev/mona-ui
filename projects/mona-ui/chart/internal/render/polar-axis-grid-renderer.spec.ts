import { describe, expect, it, vi } from "vitest";
import type { PolarAxisChartScene } from "../scene/chart-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarAxisGridRenderer } from "./polar-axis-grid-renderer";

describe("PolarAxisGridRenderer", () => {
    const styleResolver = new ChartStyleResolver();

    function createMockContext(): CanvasRenderingContext2D {
        return {
            arc: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            lineTo: vi.fn(),
            lineWidth: 1,
            moveTo: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;
    }

    const mockScene: PolarAxisChartScene = {
        angularAxis: {
            axisLine: true,
            gridLines: true,
            labelOffset: 10,
            labels: true,
            mode: "category",
            rotation: 0,
            ticks: [
                {
                    angle: 0,
                    formattedValue: "A",
                    index: 0,
                    labelPoint: { x: 200, y: 90 },
                    tickKey: "cat:A",
                    value: "A",
                    visible: true
                },
                {
                    angle: (2 * Math.PI) / 3,
                    formattedValue: "B",
                    index: 1,
                    labelPoint: { x: 286, y: 250 },
                    tickKey: "cat:B",
                    value: "B",
                    visible: true
                },
                {
                    angle: (4 * Math.PI) / 3,
                    formattedValue: "C",
                    index: 2,
                    labelPoint: { x: 114, y: 250 },
                    tickKey: "cat:C",
                    value: "C",
                    visible: true
                }
            ],
            visible: true
        },
        axisMode: "radar",
        center: { x: 200, y: 200 },
        coordinateSystem: "polar",
        hasRenderableData: true,
        height: 400,
        hitTargets: [],
        interactionBuckets: [],
        legendItems: [],
        outerRadius: 100,
        plotRect: { height: 368, width: 368, x: 16, y: 16 },
        polarKind: "axis",
        radialAxis: {
            axisLine: true,
            domain: [0, 100],
            gridLines: true,
            gridShape: "polygon",
            labelAngle: 0,
            labelOffset: 6,
            labels: true,
            ticks: [
                {
                    formattedValue: "0",
                    index: 0,
                    isZero: true,
                    labelPoint: { x: 206, y: 200 },
                    radius: 0,
                    tickKey: "val:0",
                    value: 0,
                    visible: true
                },
                {
                    formattedValue: "50",
                    index: 1,
                    isZero: false,
                    labelPoint: { x: 206, y: 150 },
                    radius: 50,
                    tickKey: "val:50",
                    value: 50,
                    visible: true
                },
                {
                    formattedValue: "100",
                    index: 2,
                    isZero: false,
                    labelPoint: { x: 206, y: 100 },
                    radius: 100,
                    tickKey: "val:100",
                    value: 100,
                    visible: true
                }
            ],
            visible: true
        },
        series: [],
        width: 400
    };

    it("should render polygon grid rings, spokes, and outer boundary", () => {
        const ctx = createMockContext();
        PolarAxisGridRenderer.render(ctx, mockScene, styleResolver);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.moveTo).toHaveBeenCalled();
        expect(ctx.lineTo).toHaveBeenCalled();
        expect(ctx.closePath).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should render circular rings when gridShape is circle", () => {
        const ctx = createMockContext();
        const circleScene: PolarAxisChartScene = {
            ...mockScene,
            radialAxis: {
                ...mockScene.radialAxis,
                gridShape: "circle"
            }
        };

        PolarAxisGridRenderer.render(ctx, circleScene, styleResolver);
        expect(ctx.arc).toHaveBeenCalled();
    });

    it("should skip grid rings or spokes when gridLines is false", () => {
        const ctx = createMockContext();
        const noGridScene: PolarAxisChartScene = {
            ...mockScene,
            angularAxis: {
                ...mockScene.angularAxis,
                gridLines: false
            },
            radialAxis: {
                ...mockScene.radialAxis,
                axisLine: false,
                gridLines: false
            }
        };

        PolarAxisGridRenderer.render(ctx, noGridScene, styleResolver);
        // Only outer boundary stroked
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });
});
