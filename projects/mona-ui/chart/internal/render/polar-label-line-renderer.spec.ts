import { describe, expect, it, vi } from "vitest";
import type { ChartPolarSeriesScene, ScenePolarSlice } from "../scene/polar-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarLabelLineRenderer } from "./polar-label-line-renderer";

describe("PolarLabelLineRenderer", () => {
    const styleResolver = new ChartStyleResolver();

    function createMockContext(): CanvasRenderingContext2D {
        return {
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
    }

    const mockSliceWithLabel: ScenePolarSlice = {
        category: "A",
        centroid: { x: 200, y: 150 },
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
        insideLabelPoint: { x: 200, y: 150 },
        label: {
            arcAnchor: { x: 250, y: 100 },
            elbow: { x: 270, y: 90 },
            heightEstimate: 18,
            lineEnd: { x: 290, y: 90 },
            naturalPosition: { x: 290, y: 90 },
            position: { x: 294, y: 90 },
            side: "right",
            visible: true,
            widthEstimate: 40
        },
        outerRadius: 100,
        padAngle: 0,
        percentage: 0.5,
        sliceId: "pie-1:slice:0",
        startAngle: 0,
        value: 50,
        visible: true
    };

    const mockSeriesScene: ChartPolarSeriesScene = {
        center: { x: 200, y: 200 },
        cornerRadius: 0,
        fillMode: "solid",
        formattedTotal: "100",
        id: "pie-1",
        innerRadius: 0,
        labelPosition: "outside",
        name: "Pie",
        outerRadius: 100,
        padAngle: 0,
        showLabels: true,
        slices: [mockSliceWithLabel],
        style: {
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeSource: "default",
            strokeWidth: 1
        },
        total: 100,
        type: "pie"
    };

    it("should draw leader lines when showLabels is true and labelPosition is outside", () => {
        const ctx = createMockContext();
        PolarLabelLineRenderer.render(ctx, mockSeriesScene, styleResolver);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.moveTo).toHaveBeenCalledWith(250, 100);
        expect(ctx.lineTo).toHaveBeenCalledWith(270, 90);
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should do nothing when labelPosition is inside", () => {
        const ctx = createMockContext();
        const insideScene: ChartPolarSeriesScene = {
            ...mockSeriesScene,
            labelPosition: "inside"
        };
        PolarLabelLineRenderer.render(ctx, insideScene, styleResolver);

        expect(ctx.beginPath).not.toHaveBeenCalled();
        expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it("should do nothing when showLabels is false", () => {
        const ctx = createMockContext();
        const noLabelsScene: ChartPolarSeriesScene = {
            ...mockSeriesScene,
            showLabels: false
        };
        PolarLabelLineRenderer.render(ctx, noLabelsScene, styleResolver);

        expect(ctx.beginPath).not.toHaveBeenCalled();
        expect(ctx.stroke).not.toHaveBeenCalled();
    });
});
