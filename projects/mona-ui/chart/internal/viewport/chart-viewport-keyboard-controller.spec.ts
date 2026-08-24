import { describe, expect, it } from "vitest";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type { ChartRect } from "../../models/chart.models";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "./cartesian-axis-coordinate-space";
import { ChartViewportKeyboardController } from "./chart-viewport-keyboard-controller";
import { normalizeChartNavigationOptions } from "./chart-navigation-options";
import { createEmptyInternalViewportState, type InternalCartesianViewportState } from "./cartesian-viewport-normalizer";

describe("ChartViewportKeyboardController", () => {
    const plotRect: ChartRect = { height: 300, width: 400, x: 50, y: 30 };
    const axisScenes: readonly ChartAxisScene[] = [
        {
            axis: "x",
            axisId: "x-1",
            axisLine: true,
            gridLines: true,
            gutter: 40,
            isPrimary: true,
            position: "bottom",
            scaleType: "linear",
            ticks: [],
            title: "X Axis",
            visible: true
        },
        {
            axis: "y",
            axisId: "y-1",
            axisLine: true,
            gridLines: true,
            gutter: 50,
            isPrimary: true,
            position: "left",
            scaleType: "linear",
            ticks: [],
            title: "Y Axis",
            visible: true
        }
    ];

    const xScale = CartesianScaleFactory.createExactPositionScale({
        type: "linear",
        domain: [0, 100],
        range: [50, 450]
    });
    const yScale = CartesianScaleFactory.createExactPositionScale({
        type: "linear",
        domain: [0, 50],
        range: [330, 30]
    });

    const xSnap: CartesianAxisCoordinateSnapshot = {
        baseDomain: [0, 100],
        baseScale: xScale,
        range: [50, 450],
        ref: { axis: "x", axisId: "x-1" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 100],
        viewportScale: xScale
    };

    const ySnap: CartesianAxisCoordinateSnapshot = {
        baseDomain: [0, 50],
        baseScale: yScale,
        range: [330, 30],
        ref: { axis: "y", axisId: "y-1" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 50],
        viewportScale: yScale
    };

    const coordSpace = new CartesianAxisCoordinateSpace(new Map([["x-1", xSnap]]), new Map([["y-1", ySnap]]));

    const options = normalizeChartNavigationOptions(true);
    const initialViewport = createEmptyInternalViewportState();
    const zoomedViewport: InternalCartesianViewportState = {
        x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 25, max: 75 }]]),
        y: new Map([["y-1", { axis: "y", axisId: "y-1", kind: "continuous", min: 10, max: 40 }]])
    };

    it("should handle Shift+ArrowLeft and Shift+ArrowRight for X-axis pan", () => {
        const leftResult = ChartViewportKeyboardController.handleKeyDown(
            { key: "ArrowLeft", shiftKey: true } as KeyboardEvent,
            coordSpace,
            plotRect,
            axisScenes,
            options,
            "vertical",
            zoomedViewport
        );
        expect(leftResult.handled).toBe(true);
        expect(leftResult.announcement).toBe("Panned left");
        expect(leftResult.nextState?.x.get("x-1")).toBeDefined();

        const rightResult = ChartViewportKeyboardController.handleKeyDown(
            { key: "ArrowRight", shiftKey: true } as KeyboardEvent,
            coordSpace,
            plotRect,
            axisScenes,
            options,
            "vertical",
            zoomedViewport
        );
        expect(rightResult.handled).toBe(true);
        expect(rightResult.announcement).toBe("Panned right");
    });

    it("should handle Shift+ArrowUp and Shift+ArrowDown for Y-axis pan", () => {
        const upResult = ChartViewportKeyboardController.handleKeyDown(
            { key: "ArrowUp", shiftKey: true } as KeyboardEvent,
            coordSpace,
            plotRect,
            axisScenes,
            options,
            "vertical",
            zoomedViewport
        );
        expect(upResult.handled).toBe(true);
        expect(upResult.announcement).toBe("Panned up");
        expect(upResult.nextState?.y.get("y-1")).toBeDefined();

        const downResult = ChartViewportKeyboardController.handleKeyDown(
            { key: "ArrowDown", shiftKey: true } as KeyboardEvent,
            coordSpace,
            plotRect,
            axisScenes,
            options,
            "vertical",
            zoomedViewport
        );
        expect(downResult.handled).toBe(true);
        expect(downResult.announcement).toBe("Panned down");
    });

    it("should handle + and - for zoom in and out", () => {
        const zoomInResult = ChartViewportKeyboardController.handleKeyDown(
            { key: "+" } as KeyboardEvent,
            coordSpace,
            plotRect,
            axisScenes,
            options,
            "vertical",
            initialViewport
        );
        expect(zoomInResult.handled).toBe(true);
        expect(zoomInResult.announcement).toBe("Zoomed in");

        const zoomOutResult = ChartViewportKeyboardController.handleKeyDown(
            { key: "-" } as KeyboardEvent,
            coordSpace,
            plotRect,
            axisScenes,
            options,
            "vertical",
            zoomInResult.nextState!
        );
        expect(zoomOutResult.handled).toBe(true);
        expect(zoomOutResult.announcement).toBe("Zoomed out");
    });

    it("should handle 0 to reset viewport", () => {
        // Zoom in first
        const zoomed = ChartViewportKeyboardController.handleKeyDown(
            { key: "+" } as KeyboardEvent,
            coordSpace,
            plotRect,
            axisScenes,
            options,
            "vertical",
            initialViewport
        );
        expect(zoomed.nextState).not.toBeNull();

        const resetResult = ChartViewportKeyboardController.handleKeyDown(
            { key: "0" } as KeyboardEvent,
            coordSpace,
            plotRect,
            axisScenes,
            options,
            "vertical",
            zoomed.nextState!
        );
        expect(resetResult.handled).toBe(true);
        expect(resetResult.announcement).toBe("Viewport reset to full range");
        expect(resetResult.nextState?.x.size).toBe(0);
        expect(resetResult.nextState?.y.size).toBe(0);
    });
});
