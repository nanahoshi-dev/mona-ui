import { describe, expect, it, vi } from "vitest";
import { RoseGridRenderer } from "./rose-grid-renderer";
import type { ChartAngularAxisScene, ChartRadialAxisScene } from "../scene/polar-axis-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";

describe("RoseGridRenderer", () => {
    const center = { x: 150, y: 150 };
    const innerRadius = 30;
    const outerRadius = 100;
    const mockStyleResolver: ChartStyleResolver = {
        getReadableForeground: () => "#000000",
        resolveCssVariable: () => "rgba(100, 100, 100, 0.5)",
        resolveGaugeSeriesStyle: vi.fn(),
        resolveHeatmapTheme: vi.fn(),
        resolvePolarSeriesStyle: vi.fn(),
        resolveRadialArcSeriesStyle: vi.fn(),
        resolveSeriesPalette: vi.fn(),
        resolveSeriesStyle: vi.fn()
    } as unknown as ChartStyleResolver;

    const createMockContext = () => {
        return {
            arc: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineTo: vi.fn(),
            lineWidth: 1,
            moveTo: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;
    };

    it("renders radial rings and angular spokes in background for full sweep", () => {
        const context = createMockContext();
        const angularAxis: ChartAngularAxisScene = {
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
                    labelPoint: { x: 0, y: 0 },
                    tickKey: "a",
                    value: "A",
                    visible: true
                },
                {
                    angle: Math.PI,
                    formattedValue: "B",
                    index: 1,
                    labelPoint: { x: 0, y: 0 },
                    tickKey: "b",
                    value: "B",
                    visible: true
                }
            ],
            visible: true
        };
        const radialAxis: ChartRadialAxisScene = {
            axisLine: true,
            domain: [0, 100],
            gridLines: true,
            gridShape: "circle",
            labelAngle: 0,
            labelOffset: 6,
            labels: true,
            ticks: [
                {
                    formattedValue: "50",
                    index: 0,
                    isZero: false,
                    labelPoint: { x: 0, y: 0 },
                    radius: 65,
                    tickKey: "50",
                    value: 50,
                    visible: true
                }
            ],
            visible: true
        };

        RoseGridRenderer.renderBackground(context, {
            angularAxis,
            center,
            endAngleRad: Math.PI * 2,
            innerRadius,
            outerRadius,
            radialAxis,
            startAngleRad: 0,
            styleResolver: mockStyleResolver
        });

        // 1 radial ring arc called with full circle 0..2*PI
        expect(context.arc).toHaveBeenCalledWith(center.x, center.y, 65, 0, Math.PI * 2);
        // Spokes drawn for 2 ticks
        expect(context.moveTo).toHaveBeenCalledTimes(2);
        expect(context.lineTo).toHaveBeenCalledTimes(2);
        expect(context.stroke).toHaveBeenCalled();
    });

    it("renders partial sweep arc segments for partial angle range", () => {
        const context = createMockContext();
        const radialAxis: ChartRadialAxisScene = {
            axisLine: true,
            domain: [0, 100],
            gridLines: true,
            gridShape: "circle",
            labelAngle: 0,
            labelOffset: 6,
            labels: true,
            ticks: [
                {
                    formattedValue: "50",
                    index: 0,
                    isZero: false,
                    labelPoint: { x: 0, y: 0 },
                    radius: 65,
                    tickKey: "50",
                    value: 50,
                    visible: true
                }
            ],
            visible: true
        };

        const startRad = 0;
        const endRad = Math.PI; // 180 deg sweep

        RoseGridRenderer.renderBackground(context, {
            center,
            endAngleRad: endRad,
            innerRadius,
            outerRadius,
            radialAxis,
            startAngleRad: startRad,
            styleResolver: mockStyleResolver
        });

        // canvasStart = 0 - PI/2 = -PI/2, canvasEnd = PI - PI/2 = PI/2
        expect(context.arc).toHaveBeenCalledWith(center.x, center.y, 65, -Math.PI / 2, Math.PI / 2);
    });

    it("renders foreground axis line and outer boundary arc", () => {
        const context = createMockContext();
        const angularAxis: ChartAngularAxisScene = {
            axisLine: true,
            gridLines: false,
            labelOffset: 10,
            labels: true,
            mode: "category",
            rotation: 0,
            ticks: [],
            visible: true
        };
        const radialAxis: ChartRadialAxisScene = {
            axisLine: true,
            domain: [0, 100],
            gridLines: false,
            gridShape: "circle",
            labelAngle: 90,
            labelOffset: 6,
            labels: true,
            ticks: [],
            visible: true
        };

        RoseGridRenderer.renderForeground(context, {
            angularAxis,
            center,
            endAngleRad: Math.PI * 2,
            innerRadius,
            outerRadius,
            radialAxis,
            startAngleRad: 0,
            styleResolver: mockStyleResolver
        });

        // Radial axis spoke line drawn
        expect(context.moveTo).toHaveBeenCalled();
        expect(context.lineTo).toHaveBeenCalled();
        // Outer boundary arc drawn
        expect(context.arc).toHaveBeenCalledWith(center.x, center.y, outerRadius, 0, Math.PI * 2);
    });
});
