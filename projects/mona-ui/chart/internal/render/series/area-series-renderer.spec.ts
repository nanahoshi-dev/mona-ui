import { describe, expect, it, vi } from "vitest";
import type { ChartAreaSeriesScene } from "../../scene/cartesian-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { AreaSeriesRenderer } from "./area-series-renderer";

describe("AreaSeriesRenderer", () => {
    function createMockContext(): CanvasRenderingContext2D {
        return {
            arc: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            createLinearGradient: vi.fn().mockReturnValue({
                addColorStop: vi.fn()
            }),
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
        fillOpacity: 0.2,
        lineStyle,
        lineWidth: 2,
        opacity: 1,
        pointRadius: 4
    });

    it("should render solid boundary line with empty line dash (ARE-001)", () => {
        const ctx = createMockContext();
        const scene: ChartAreaSeriesScene = {
            baselineY: 100,
            connectNulls: false,
            curve: "linear",
            fillMode: "solid",
            fillOpacity: 0.2,
            id: "area-1",
            name: "Area 1",
            points: [
                { animationKey: "p1", baseY: 100, datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", baseY: 100, datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints: false,
            style: createStyle("solid"),
            type: "area",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        AreaSeriesRenderer.render(ctx, scene);

        expect(ctx.fill).toHaveBeenCalledTimes(1);
        expect(ctx.setLineDash).toHaveBeenCalledWith([]);
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it("should render dashed boundary line with [4, 4] dash pattern (ARE-002)", () => {
        const ctx = createMockContext();
        const scene: ChartAreaSeriesScene = {
            baselineY: 100,
            connectNulls: false,
            curve: "linear",
            fillMode: "gradient",
            fillOpacity: 0.2,
            id: "area-1",
            name: "Area 1",
            points: [
                { animationKey: "p1", baseY: 100, datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", baseY: 100, datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints: false,
            style: createStyle("dashed"),
            type: "area",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        AreaSeriesRenderer.render(ctx, scene);

        expect(ctx.fill).toHaveBeenCalledTimes(1);
        expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it("should render dotted boundary line with [2, 2] dash pattern (ARE-003)", () => {
        const ctx = createMockContext();
        const scene: ChartAreaSeriesScene = {
            baselineY: 100,
            connectNulls: false,
            curve: "linear",
            fillMode: "solid",
            fillOpacity: 0.2,
            id: "area-1",
            name: "Area 1",
            points: [
                { animationKey: "p1", baseY: 100, datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", baseY: 100, datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints: false,
            style: createStyle("dotted"),
            type: "area",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        AreaSeriesRenderer.render(ctx, scene);

        expect(ctx.fill).toHaveBeenCalledTimes(1);
        expect(ctx.setLineDash).toHaveBeenCalledWith([2, 2]);
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it("should reset line dash before rendering point markers in area series (ARE-004)", () => {
        const ctx = createMockContext();
        const callOrder: string[] = [];
        (ctx.fill as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callOrder.push("fill");
        });
        (ctx.setLineDash as ReturnType<typeof vi.fn>).mockImplementation((pattern: number[]) => {
            callOrder.push(`setLineDash:${pattern.join(",")}`);
        });
        (ctx.stroke as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callOrder.push("stroke");
        });
        (ctx.arc as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callOrder.push("arc");
        });

        const scene: ChartAreaSeriesScene = {
            baselineY: 100,
            connectNulls: false,
            curve: "linear",
            fillMode: "solid",
            fillOpacity: 0.2,
            id: "area-1",
            name: "Area 1",
            points: [
                { animationKey: "p1", baseY: 100, datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", baseY: 100, datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints: true,
            style: createStyle("dashed"),
            type: "area",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        AreaSeriesRenderer.render(ctx, scene);

        // Sequence must be: fill -> setLineDash:4,4 -> boundary stroke -> setLineDash: -> marker arcs
        expect(callOrder[0]).toBe("fill");
        expect(callOrder[1]).toBe("setLineDash:4,4");
        expect(callOrder[2]).toBe("stroke");
        expect(callOrder[3]).toBe("setLineDash:");
        expect(callOrder).toContain("arc");
    });

    it("should handle empty points without errors", () => {
        const ctx = createMockContext();
        const scene: ChartAreaSeriesScene = {
            baselineY: 100,
            connectNulls: false,
            curve: "linear",
            fillMode: "solid",
            fillOpacity: 0.2,
            id: "area-1",
            name: "Area 1",
            points: [],
            showPoints: true,
            style: createStyle("dashed"),
            type: "area",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        AreaSeriesRenderer.render(ctx, scene);
        expect(ctx.fill).not.toHaveBeenCalled();
        expect(ctx.stroke).not.toHaveBeenCalled();
    });
});
