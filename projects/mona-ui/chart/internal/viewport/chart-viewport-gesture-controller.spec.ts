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
        controller.flushPendingFrame();

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

    it("should return false on wheel zoom when at boundary and not ctrlKey", () => {
        const { context } = createMockContext({
            // Viewport already fully zoomed out to base domain and clampToData true
            currentViewport: createEmptyInternalViewportState(),
            navigationOptions: normalizeChartNavigationOptions({
                clampToData: true,
                wheelZoom: true
            })
        });
        const controller = new ChartViewportGestureController(context);

        // Zoom out (positive deltaY) when already at full boundary
        const handled = controller.handleWheel(
            { ctrlKey: false, deltaY: 100 } as WheelEvent,
            { x: 250, y: 180 }
        );

        expect(handled).toBe(false);
    });

    it("should return true on ctrlKey wheel even when zoomFactor doesn't change to prevent page zoom", () => {
        const { context } = createMockContext({
            currentViewport: createEmptyInternalViewportState(),
            navigationOptions: normalizeChartNavigationOptions({
                clampToData: true,
                wheelZoom: true
            })
        });
        const controller = new ChartViewportGestureController(context);

        const handled = controller.handleWheel(
            { ctrlKey: true, deltaY: 100 } as WheelEvent,
            { x: 250, y: 180 }
        );

        expect(handled).toBe(true);
    });

    it("should perform silent teardown on destroy() without emitting events", () => {
        const { context, events } = createMockContext();
        const controller = new ChartViewportGestureController(context);

        controller.handlePointerDown(
            { button: 0, pointerId: 1 } as PointerEvent,
            { x: 100, y: 100 }
        );
        controller.handlePointerMove(
            { pointerId: 1 } as PointerEvent,
            { x: 150, y: 100 }
        );
        expect(controller.isDragging).toBe(true);

        const eventCountBeforeDestroy = events.length;

        // Destroy controller
        controller.destroy();

        expect(controller.isDragging).toBe(false);
        // No end event was emitted during destroy
        expect(events.length).toBe(eventCountBeforeDestroy);
    });

    it("should handle lostpointercapture event and end active drag gracefully", () => {
        const { context, events } = createMockContext();
        const controller = new ChartViewportGestureController(context);

        controller.handlePointerDown(
            { button: 0, pointerId: 5 } as PointerEvent,
            { x: 100, y: 100 }
        );
        controller.handlePointerMove(
            { pointerId: 5 } as PointerEvent,
            { x: 120, y: 100 }
        );
        expect(controller.isDragging).toBe(true);

        controller.handleLostPointerCapture({ pointerId: 5 } as PointerEvent);

        expect(controller.isDragging).toBe(false);
        const lastEvent = events[events.length - 1];
        expect(lastEvent.source).toBe("drag");
        expect(lastEvent.phase).toBe("end");
    });

    describe("Wheel Anchor Rebasing & Timer Ownership (PZV8-002)", () => {
        it("should clear old debounce timer on anchor rebase so session is not terminated prematurely", () => {
            vi.useFakeTimers();
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            // t = 0: first wheel event
            controller.handleWheel({ deltaY: -50 } as WheelEvent, { x: 200, y: 150 });
            expect(events.length).toBe(1);
            expect(events[0].phase).toBe("start");

            // t = 80ms: pointer moves > 8px and fires second wheel event (rebase anchor)
            vi.advanceTimersByTime(80);
            controller.handleWheel({ deltaY: -50 } as WheelEvent, { x: 230, y: 150 });

            // t = 151ms (151ms after first event, 71ms after second event)
            vi.advanceTimersByTime(71);
            const endEventsAt151 = events.filter(e => e.phase === "end");
            expect(endEventsAt151.length).toBe(0); // Session must NOT have ended!

            // t = 230ms (150ms after second event)
            vi.advanceTimersByTime(79);
            const endEventsAt230 = events.filter(e => e.phase === "end");
            expect(endEventsAt230.length).toBe(1);
            expect(endEventsAt230[0].source).toBe("wheel");

            vi.useRealTimers();
        });

        it("should handle multiple anchor rebases (A -> B -> C) with exactly one final end event", () => {
            vi.useFakeTimers();
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handleWheel({ deltaY: -30 } as WheelEvent, { x: 100, y: 100 }); // Session A
            vi.advanceTimersByTime(50);
            controller.handleWheel({ deltaY: -30 } as WheelEvent, { x: 150, y: 100 }); // Rebase to B
            vi.advanceTimersByTime(50);
            controller.handleWheel({ deltaY: -30 } as WheelEvent, { x: 200, y: 100 }); // Rebase to C

            // 100ms after C: still active
            vi.advanceTimersByTime(100);
            expect(events.filter(e => e.phase === "end").length).toBe(0);

            // 150ms after C: ends cleanly exactly once
            vi.advanceTimersByTime(50);
            expect(events.filter(e => e.phase === "end").length).toBe(1);

            vi.useRealTimers();
        });
    });

    describe("Authority-Change Lifecycle & Click Suppression (PZV8-003)", () => {
        it("should emit exactly one end event and retain click suppression for active drag", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 100 });
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 130, y: 100 });
            controller.flushPendingFrame();

            expect(controller.isDragging).toBe(true);
            expect(controller.isClickSuppressed).toBe(true);
            const startEvents = events.filter(e => e.phase === "start");
            expect(startEvents.length).toBe(1);

            // Authority change abort
            controller.abortForAuthorityChange();

            expect(controller.isDragging).toBe(false);
            const endEvents = events.filter(e => e.phase === "end");
            expect(endEvents.length).toBe(1);
            expect(endEvents[0].source).toBe("drag");
            // Click suppression must be preserved across authority change!
            expect(controller.isClickSuppressed).toBe(true);
            expect(controller.consumeClickSuppression()).toBe(true);
            expect(controller.isClickSuppressed).toBe(false);
        });

        it("should stay completely silent for pre-threshold drag on authority change", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 100 });
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 102, y: 100 }); // 2px < 4px

            expect(controller.isDragging).toBe(false);
            expect(controller.isClickSuppressed).toBe(false);

            controller.abortForAuthorityChange();

            expect(events.length).toBe(0);
            expect(controller.isClickSuppressed).toBe(false);
        });

        it("should emit exactly one end event and retain click suppression for active pinch", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 150 });
            controller.handlePointerDown({ button: 0, pointerId: 2 } as PointerEvent, { x: 200, y: 150 });

            expect(controller.isPinching).toBe(true);
            expect(controller.isClickSuppressed).toBe(true);

            controller.abortForAuthorityChange();

            expect(controller.isPinching).toBe(false);
            const endEvents = events.filter(e => e.phase === "end");
            expect(endEvents.length).toBe(1);
            expect(endEvents[0].source).toBe("pinch");
            expect(controller.consumeClickSuppression()).toBe(true);
        });

        it("should emit exactly one end event and clear debounce timer for active wheel on authority change", () => {
            vi.useFakeTimers();
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handleWheel({ deltaY: -50 } as WheelEvent, { x: 200, y: 150 });
            expect(events.length).toBe(1);
            expect(events[0].phase).toBe("start");

            controller.abortForAuthorityChange();

            const endEvents = events.filter(e => e.phase === "end");
            expect(endEvents.length).toBe(1);
            expect(endEvents[0].source).toBe("wheel");

            // Advance timers: ensure no duplicate end event is fired
            vi.advanceTimersByTime(300);
            expect(events.filter(e => e.phase === "end").length).toBe(1);

            vi.useRealTimers();
        });
    });

    describe("Gesture Reversibility & Event Partition Invariance (PZV8-012)", () => {
        it("restores initial viewport when wheel delta is inverted within active session", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handleWheel({ deltaY: -100 } as WheelEvent, { x: 250, y: 180 });
            controller.flushPendingFrame();
            const zoomedOut = events[events.length - 1];
            expect(zoomedOut.phase).toBe("update");

            // Invert delta back (+100)
            controller.handleWheel({ deltaY: 100 } as WheelEvent, { x: 250, y: 180 });
            controller.flushPendingFrame();
            const restored = events[events.length - 1];
            expect(restored.phase).toBe("update");
            expect(restored.viewport).toEqual(events[0].viewport);
        });

        it("produces identical final viewport for partitioned drag events (1x100px vs 10x10px)", () => {
            // Drag 1: 1 x 100px
            const ctx1 = createMockContext();
            const ctrl1 = new ChartViewportGestureController(ctx1.context);
            ctrl1.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 100 });
            ctrl1.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 200, y: 100 });
            ctrl1.flushPendingFrame();
            const finalVp1 = ctx1.events[ctx1.events.length - 1].viewport;

            // Drag 2: 10 x 10px
            const ctx2 = createMockContext();
            const ctrl2 = new ChartViewportGestureController(ctx2.context);
            ctrl2.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 100 });
            for (let px = 110; px <= 200; px += 10) {
                ctrl2.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: px, y: 100 });
            }
            ctrl2.flushPendingFrame();
            const finalVp2 = ctx2.events[ctx2.events.length - 1].viewport;

            expect(finalVp1).toEqual(finalVp2);
        });

        it("transitions from 2-pointer pinch to 1-pointer drag seeded from pinch viewport", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 150 });
            controller.handlePointerDown({ button: 0, pointerId: 2 } as PointerEvent, { x: 200, y: 150 });
            controller.handlePointerMove({ pointerId: 2 } as PointerEvent, { x: 260, y: 150 });
            controller.flushPendingFrame();

            const pinchUpdate = events[events.length - 1];
            expect(pinchUpdate.source).toBe("pinch");
            expect(pinchUpdate.phase).toBe("update");

            // Release pointer 1 -> pinch ends, remaining pointer 2 initiates drag seeded from pinch proposal
            controller.handlePointerUp({ pointerId: 1 } as PointerEvent);
            expect(controller.isPinching).toBe(false);

            // Move pointer 2
            controller.handlePointerMove({ pointerId: 2 } as PointerEvent, { x: 280, y: 150 });
            controller.flushPendingFrame();

            expect(controller.isDragging).toBe(true);
            const dragEvents = events.filter(e => e.source === "drag");
            expect(dragEvents.length).toBeGreaterThanOrEqual(1);
        });
    });
});
