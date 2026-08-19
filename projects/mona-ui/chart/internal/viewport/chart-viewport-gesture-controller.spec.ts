import { describe, expect, it, vi } from "vitest";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartViewportChangeEvent } from "../../models/chart-viewport.models";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "./cartesian-axis-coordinate-space";
import { ChartViewportGestureController, type ChartViewportGestureContext } from "./chart-viewport-gesture-controller";
import { normalizeChartNavigationOptions } from "./chart-navigation-options";
import { createEmptyInternalViewportState, type InternalCartesianViewportState } from "./cartesian-viewport-normalizer";

describe("ChartViewportGestureController", () => {
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

    const coordSpace = new CartesianAxisCoordinateSpace(
        new Map([["x-1", xSnap]]),
        new Map([["y-1", ySnap]])
    );

    function createMockContext(overrides?: Partial<ChartViewportGestureContext>): {
        context: ChartViewportGestureContext;
        cursorHistory: (string | null)[];
        events: ChartViewportChangeEvent[];
        nextStates: InternalCartesianViewportState[];
    } {
        const events: ChartViewportChangeEvent[] = [];
        const nextStates: InternalCartesianViewportState[] = [];
        const cursorHistory: (string | null)[] = [];

        const context: ChartViewportGestureContext = {
            axisScenes,
            coordinateSpace: coordSpace,
            currentViewport: createEmptyInternalViewportState(),
            navigationOptions: normalizeChartNavigationOptions(true),
            onCursorChange: c => cursorHistory.push(c),
            onViewportChange: (state, event) => {
                nextStates.push(state);
                events.push(event);
            },
            orientation: "vertical",
            plotRect,
            ...overrides
        };

        return { context, cursorHistory, events, nextStates };
    }

    it("should ignore gestures when navigation is disabled", () => {
        const { context } = createMockContext({
            navigationOptions: normalizeChartNavigationOptions(false)
        });
        const controller = new ChartViewportGestureController(context);

        const handledDown = controller.handlePointerDown(
            { button: 0, pointerId: 1 } as PointerEvent,
            { x: 100, y: 100 }
        );
        expect(handledDown).toBe(false);
        expect(controller.isDragging).toBe(false);
    });

    it("should start drag pan after exceeding 4px threshold and suppress click", () => {
        const { context, cursorHistory, events } = createMockContext();
        const controller = new ChartViewportGestureController(context);

        const downResult = controller.handlePointerDown(
            { button: 0, pointerId: 1 } as PointerEvent,
            { x: 100, y: 100 }
        );
        expect(downResult).toBe(true);
        expect(controller.isDragging).toBe(false);
        expect(controller.isClickSuppressed).toBe(false);

        // Move 2px (sub-threshold)
        const move1 = controller.handlePointerMove(
            { pointerId: 1 } as PointerEvent,
            { x: 102, y: 100 }
        );
        expect(move1).toBe(false);
        expect(controller.isDragging).toBe(false);

        // Move beyond 4px (threshold met)
        const move2 = controller.handlePointerMove(
            { pointerId: 1 } as PointerEvent,
            { x: 110, y: 100 }
        );
        expect(move2).toBe(true);
        expect(controller.isDragging).toBe(true);
        expect(controller.isClickSuppressed).toBe(true);
        expect(cursorHistory).toContain("grabbing");

        expect(events.length).toBeGreaterThan(0);
        expect(events[0].source).toBe("drag");
        expect(events[0].phase).toBe("start");

        // Pointer up finishes drag
        const up = controller.handlePointerUp({ pointerId: 1 } as PointerEvent);
        expect(up).toBe(true);
        expect(controller.isDragging).toBe(false);
        expect(cursorHistory[cursorHistory.length - 1]).toBe(null);
    });

    it("should handle wheel zoom with debounce end phase", () => {
        vi.useFakeTimers();
        const { context, events } = createMockContext();
        const controller = new ChartViewportGestureController(context);

        const handled = controller.handleWheel(
            { deltaY: -100 } as WheelEvent,
            { x: 250, y: 180 }
        );
        expect(handled).toBe(true);
        expect(events.length).toBeGreaterThanOrEqual(1);
        expect(events[0].source).toBe("wheel");
        expect(events[0].phase).toBe("start");

        // Fast-forward debounce timer (150ms)
        vi.advanceTimersByTime(200);

        const endEvent = events[events.length - 1];
        expect(endEvent.source).toBe("wheel");
        expect(endEvent.phase).toBe("end");
        vi.useRealTimers();
    });

    it("should handle two-pointer pinch zoom", () => {
        const { context, events } = createMockContext();
        const controller = new ChartViewportGestureController(context);

        // Pointer 1 down
        controller.handlePointerDown(
            { button: 0, pointerId: 1 } as PointerEvent,
            { x: 100, y: 150 }
        );

        // Pointer 2 down -> initiates pinch
        const pinchDown = controller.handlePointerDown(
            { button: 0, pointerId: 2 } as PointerEvent,
            { x: 200, y: 150 }
        );
        expect(pinchDown).toBe(true);
        expect(controller.isPinching).toBe(true);

        const startEvent = events[events.length - 1];
        expect(startEvent.source).toBe("pinch");
        expect(startEvent.phase).toBe("start");

        // Move pointer 2 outwards (spread / zoom in)
        const move = controller.handlePointerMove(
            { pointerId: 2 } as PointerEvent,
            { x: 260, y: 150 }
        );
        expect(move).toBe(true);

        const updateEvent = events[events.length - 1];
        expect(updateEvent.source).toBe("pinch");
        expect(updateEvent.phase).toBe("update");

        // Release pointer 1
        const up = controller.handlePointerUp({ pointerId: 1 } as PointerEvent);
        expect(up).toBe(true);
        expect(controller.isPinching).toBe(false);

        const endEvent = events[events.length - 1];
        expect(endEvent.source).toBe("pinch");
        expect(endEvent.phase).toBe("end");
    });
});
