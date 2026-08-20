import { describe, expect, it, vi } from "vitest";
import { signal } from "@angular/core";
import { CartesianCrosshairRenderer } from "./cartesian-crosshair-renderer";
import type { ChartCrosshairState } from "../interaction/chart-crosshair-state";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import type { ChartRect } from "../../models/chart.models";

function createMockContext() {
    return {
        beginPath: vi.fn(),
        clip: vi.fn(),
        globalAlpha: 1,
        lineTo: vi.fn(),
        lineWidth: 1,
        moveTo: vi.fn(),
        rect: vi.fn(),
        restore: vi.fn(),
        save: vi.fn(),
        setLineDash: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: ""
    } as unknown as CanvasRenderingContext2D;
}

describe("CartesianCrosshairRenderer", () => {
    const plotRect: ChartRect = { height: 200, width: 400, x: 50, y: 50 };
    const styleResolver = new ChartStyleResolver();

    it("renders X and Y crosshair lines when present in crosshair state", () => {
        const ctx = createMockContext();
        const reg: ChartCrosshairRegistration = {
            color: signal("#3b82f6"),
            element: { nativeElement: document.createElement("div") },
            enabled: signal(true),
            labelOffset: signal(4),
            lineStyle: signal("dashed"),
            lineWidth: signal(1.5),
            maxSnapDistance: signal(32),
            mode: signal("xy"),
            opacity: signal(0.8),
            showAxisLabels: signal(true),
            showXLabel: signal(undefined),
            showYLabel: signal(undefined),
            snap: signal("nearest"),
            template: signal(undefined),
            userClass: signal(""),
            xAxisId: signal(undefined),
            yAxisId: signal(undefined)
        };

        const state: ChartCrosshairState = {
            anchor: { x: 250, y: 150 },
            snapped: true,
            source: "pointer",
            x: {
                axis: "x",
                axisId: "x-main",
                coordinate: 250,
                formattedValue: "50",
                value: 50
            },
            y: {
                axis: "y",
                axisId: "y-main",
                coordinate: 150,
                formattedValue: "500",
                value: 500
            }
        };

        CartesianCrosshairRenderer.render(ctx, state, reg, plotRect, styleResolver);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.clip).toHaveBeenCalled();
        expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
        expect(ctx.stroke).toHaveBeenCalledTimes(2); // one for X, one for Y
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("bails out when crosshair is disabled or state is null", () => {
        const ctx = createMockContext();
        const reg: ChartCrosshairRegistration = {
            color: signal(undefined),
            element: { nativeElement: document.createElement("div") },
            enabled: signal(false),
            labelOffset: signal(4),
            lineStyle: signal("dashed"),
            lineWidth: signal(1),
            maxSnapDistance: signal(32),
            mode: signal("xy"),
            opacity: signal(1),
            showAxisLabels: signal(true),
            showXLabel: signal(undefined),
            showYLabel: signal(undefined),
            snap: signal("nearest"),
            template: signal(undefined),
            userClass: signal(""),
            xAxisId: signal(undefined),
            yAxisId: signal(undefined)
        };

        CartesianCrosshairRenderer.render(ctx, null, reg, plotRect, styleResolver);
        expect(ctx.save).not.toHaveBeenCalled();
    });
});
