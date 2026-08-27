import { describe, expect, it, vi } from "vitest";
import type { ChartLineSeriesScene } from "../../scene/cartesian-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { LineSeriesRenderer } from "./line-series-renderer";

describe("LineSeriesRenderer", () => {
    function createMockContext(): CanvasRenderingContext2D {
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
            setLineDash: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;
    }

    const createStyle = (lineStyle: "solid" | "dashed" | "dotted" = "solid"): ChartSeriesStyle => ({
        areaFillColor: "#3b82f6",
        areaFillOpacity: 0.2,
        color: "#3b82f6",
        fillOpacity: 1,
        lineStyle,
        lineWidth: 2,
        opacity: 1,
        pointRadius: 4
    });

    it("should render solid line with empty line dash (LIN-001)", () => {
        const ctx = createMockContext();
        const scene: ChartLineSeriesScene = {
            connectNulls: false,
            curve: "linear",
            id: "line-1",
            name: "Line 1",
            points: [
                { animationKey: "p1", datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints: false,
            style: createStyle("solid"),
            type: "line",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        LineSeriesRenderer.render(ctx, scene);

        expect(ctx.setLineDash).toHaveBeenCalledWith([]);
        expect(ctx.lineWidth).toBe(2);
        expect(ctx.strokeStyle).toBe("#3b82f6");
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it("should render dashed line with [4, 4] dash pattern (LIN-002)", () => {
        const ctx = createMockContext();
        const scene: ChartLineSeriesScene = {
            connectNulls: false,
            curve: "linear",
            id: "line-1",
            name: "Line 1",
            points: [
                { animationKey: "p1", datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints: false,
            style: createStyle("dashed"),
            type: "line",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        LineSeriesRenderer.render(ctx, scene);

        expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it("should render dotted line with [2, 2] dash pattern (LIN-003)", () => {
        const ctx = createMockContext();
        const scene: ChartLineSeriesScene = {
            connectNulls: false,
            curve: "linear",
            id: "line-1",
            name: "Line 1",
            points: [
                { animationKey: "p1", datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints: false,
            style: createStyle("dotted"),
            type: "line",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        LineSeriesRenderer.render(ctx, scene);

        expect(ctx.setLineDash).toHaveBeenCalledWith([2, 2]);
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it("should reset line dash before rendering point markers so marker borders remain solid (LIN-004)", () => {
        const ctx = createMockContext();
        const callOrder: string[] = [];
        (ctx.setLineDash as ReturnType<typeof vi.fn>).mockImplementation((pattern: number[]) => {
            callOrder.push(`setLineDash:${pattern.join(",")}`);
        });
        (ctx.stroke as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callOrder.push("stroke");
        });
        (ctx.arc as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callOrder.push("arc");
        });

        const scene: ChartLineSeriesScene = {
            connectNulls: false,
            curve: "linear",
            id: "line-1",
            name: "Line 1",
            points: [
                { animationKey: "p1", datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints: true,
            style: createStyle("dashed"),
            type: "line",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        LineSeriesRenderer.render(ctx, scene);

        // Sequence must be: setLineDash:4,4 -> line stroke -> setLineDash: (reset to empty) -> marker arcs/strokes
        expect(callOrder[0]).toBe("setLineDash:4,4");
        expect(callOrder[1]).toBe("stroke");
        expect(callOrder[2]).toBe("setLineDash:");
        expect(callOrder).toContain("arc");
    });

    it("should handle empty points without errors", () => {
        const ctx = createMockContext();
        const scene: ChartLineSeriesScene = {
            connectNulls: false,
            curve: "linear",
            id: "line-1",
            name: "Line 1",
            points: [],
            showPoints: true,
            style: createStyle("dashed"),
            type: "line",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        LineSeriesRenderer.render(ctx, scene);
        expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it("should respect connectNulls: false with disconnected segments", () => {
        const ctx = createMockContext();
        const scene: ChartLineSeriesScene = {
            connectNulls: false,
            curve: "linear",
            id: "line-1",
            name: "Line 1",
            points: [
                { animationKey: "p1", datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", datum: {}, defined: false, index: 1, x: 50, xValue: 1, y: 50, yValue: 0 },
                { animationKey: "p3", datum: {}, defined: true, index: 2, x: 100, xValue: 2, y: 20, yValue: 30 }
            ],
            showPoints: true,
            style: createStyle("dotted"),
            type: "line",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        LineSeriesRenderer.render(ctx, scene);
        expect(ctx.setLineDash).toHaveBeenCalledWith([2, 2]);
        expect(ctx.stroke).toHaveBeenCalled();
        // Point markers only drawn for defined points (p1 and p3)
        expect(ctx.arc).toHaveBeenCalledTimes(2);
    });
});
