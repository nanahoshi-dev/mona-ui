import { describe, expect, it, vi } from "vitest";
import { CartesianBrushTargetResolver } from "./cartesian-brush-target-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartBrushRegistration } from "../context/chart-registration-context";
import { signal } from "@angular/core";

describe("CartesianBrushTargetResolver Unit Tests", () => {
    const mockScene: CartesianXYChartScene = {
        axes: [
            { axis: "x", axisId: "x1", axisLine: true, gridLines: false, isPrimary: true, position: "bottom", ticks: [], title: "X1", visible: true },
            { axis: "y", axisId: "y1", axisLine: true, gridLines: false, isPrimary: true, position: "left", ticks: [], title: "Y1", visible: true },
            { axis: "y", axisId: "y2", axisLine: true, gridLines: false, isPrimary: false, position: "right", ticks: [], title: "Y2", visible: true }
        ],
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [],
        interactionBuckets: [],
        legendItems: [],
        plotRect: { x: 40, y: 10, width: 500, height: 260 },
        primaryXAxisId: "x1",
        primaryYAxisId: "y1",
        series: [],
        width: 600
    };

    it("resolves explicit valid xAxisId and yAxisId", () => {
        const reg = {
            mode: signal("xy"),
            xAxisId: signal("x1"),
            yAxisId: signal("y2")
        } as unknown as ChartBrushRegistration;

        const resolved = CartesianBrushTargetResolver.resolve(mockScene, reg);
        expect(resolved.mode).toBe("xy");
        expect(resolved.xAxisId).toBe("x1");
        expect(resolved.yAxisId).toBe("y2");
        expect(resolved.isValidX).toBe(true);
        expect(resolved.isValidY).toBe(true);
    });

    it("warns and falls back to primary axis when invalid yAxisId is provided", () => {
        const warnCallback = vi.fn();
        const reg = {
            mode: signal("y"),
            yAxisId: signal("invalidY")
        } as unknown as ChartBrushRegistration;

        const resolved = CartesianBrushTargetResolver.resolve(mockScene, reg, warnCallback);
        expect(warnCallback).toHaveBeenCalled();
        expect(resolved.yAxisId).toBe("y1");
        expect(resolved.isValidY).toBe(false);
    });

    it("defaults missing axis IDs to primary axes", () => {
        const reg = {
            mode: signal("xy")
        } as unknown as ChartBrushRegistration;

        const resolved = CartesianBrushTargetResolver.resolve(mockScene, reg);
        expect(resolved.xAxisId).toBe("x1");
        expect(resolved.yAxisId).toBe("y1");
        expect(resolved.isValidX).toBe(true);
        expect(resolved.isValidY).toBe(true);
    });
});
