import { describe, expect, it } from "vitest";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type { ChartRect } from "../../models/chart.models";
import { CartesianViewportTargetResolver } from "./cartesian-viewport-target-resolver";
import { normalizeChartNavigationOptions } from "./chart-navigation-options";

describe("CartesianViewportTargetResolver", () => {
    const plotRect: ChartRect = { height: 300, width: 400, x: 50, y: 30 };
    const axisScenes: readonly ChartAxisScene[] = [
        {
            axis: "x",
            axisId: "x-bottom",
            axisLine: true,
            gridLines: true,
            gutter: 40,
            isPrimary: true,
            position: "bottom",
            scaleType: "continuous-numeric",
            ticks: [],
            title: "Bottom X",
            visible: true
        },
        {
            axis: "y",
            axisId: "y-left",
            axisLine: true,
            gridLines: true,
            gutter: 50,
            isPrimary: true,
            position: "left",
            scaleType: "continuous-numeric",
            ticks: [],
            title: "Left Y",
            visible: true
        },
        {
            axis: "y",
            axisId: "y-right",
            axisLine: true,
            gridLines: true,
            gutter: 45,
            isPrimary: false,
            position: "right",
            scaleType: "continuous-numeric",
            ticks: [],
            title: "Right Y",
            visible: true
        }
    ];

    const options = normalizeChartNavigationOptions(true);

    it("should detect bottom axis gutter hit", () => {
        // Bottom axis gutter is from y: 330 to y: 370, x: 50 to 450
        const result = CartesianViewportTargetResolver.resolveTargets(
            { x: 200, y: 350 },
            plotRect,
            axisScenes,
            options,
            "vertical"
        );
        expect(result.isAxisGutterHit).toBe(true);
        expect(result.targetAxes).toEqual([{ axis: "x", axisId: "x-bottom" }]);
    });

    it("should detect left axis gutter hit", () => {
        // Left axis gutter is from x: 0 to x: 50, y: 30 to 330
        const result = CartesianViewportTargetResolver.resolveTargets(
            { x: 25, y: 150 },
            plotRect,
            axisScenes,
            options,
            "vertical"
        );
        expect(result.isAxisGutterHit).toBe(true);
        expect(result.targetAxes).toEqual([{ axis: "y", axisId: "y-left" }]);
    });

    it("should detect right axis gutter hit", () => {
        // Right axis gutter is from x: 450 to x: 495, y: 30 to 330
        const result = CartesianViewportTargetResolver.resolveTargets(
            { x: 470, y: 150 },
            plotRect,
            axisScenes,
            options,
            "vertical"
        );
        expect(result.isAxisGutterHit).toBe(true);
        expect(result.targetAxes).toEqual([
            { axis: "y", axisId: "y-right" }
        ]);
    });

    it("should target all visible axes when pointer is inside plot rect and panAxes is auto", () => {
        const result = CartesianViewportTargetResolver.resolveTargets(
            { x: 200, y: 150 },
            plotRect,
            axisScenes,
            options,
            "vertical"
        );
        expect(result.isAxisGutterHit).toBe(false);
        expect(result.targetAxes).toEqual([
            { axis: "x", axisId: "x-bottom" },
            { axis: "y", axisId: "y-left" },
            { axis: "y", axisId: "y-right" }
        ]);
    });

    it("should target only X axes when panAxes is locked to x", () => {
        const xOnlyOptions = normalizeChartNavigationOptions({ panAxes: "x" });
        const result = CartesianViewportTargetResolver.resolveTargets(
            { x: 200, y: 150 },
            plotRect,
            axisScenes,
            xOnlyOptions,
            "vertical"
        );
        expect(result.isAxisGutterHit).toBe(false);
        expect(result.targetAxes).toEqual([{ axis: "x", axisId: "x-bottom" }]);
    });

    it("should target only Y axes when panAxes is locked to y", () => {
        const yOnlyOptions = normalizeChartNavigationOptions({ panAxes: "y" });
        const result = CartesianViewportTargetResolver.resolveTargets(
            { x: 200, y: 150 },
            plotRect,
            axisScenes,
            yOnlyOptions,
            "vertical"
        );
        expect(result.isAxisGutterHit).toBe(false);
        expect(result.targetAxes).toEqual([
            { axis: "y", axisId: "y-left" },
            { axis: "y", axisId: "y-right" }
        ]);
    });

    it("should resolve explicit targets correctly", () => {
        expect(CartesianViewportTargetResolver.resolveExplicitTarget("x", axisScenes)).toEqual([
            { axis: "x", axisId: "x-bottom" }
        ]);
        expect(CartesianViewportTargetResolver.resolveExplicitTarget("y", axisScenes)).toEqual([
            { axis: "y", axisId: "y-left" },
            { axis: "y", axisId: "y-right" }
        ]);
        expect(
            CartesianViewportTargetResolver.resolveExplicitTarget(
                [{ axis: "y", axisId: "y-right" }],
                axisScenes
            )
        ).toEqual([{ axis: "y", axisId: "y-right" }]);
    });
});
