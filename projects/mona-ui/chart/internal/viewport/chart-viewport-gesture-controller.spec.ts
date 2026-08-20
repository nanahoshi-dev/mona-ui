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

    describe("Tenth Remediation Gesture Capture Ownership (PZV10-WP3 / Section 15)", () => {
        it("tracks inherited pointer capture across pinch->drag and releases upon authority change before drag threshold", () => {
            const captured = new Set<number>();
            const { context, events } = createMockContext({
                setPointerCapture: (id: number) => captured.add(id),
                releasePointerCapture: (id: number) => captured.delete(id)
            });
            const controller = new ChartViewportGestureController(context);

            // Start pinch with pointers 1 and 2
            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 150 });
            controller.handlePointerDown({ button: 0, pointerId: 2 } as PointerEvent, { x: 200, y: 150 });
            expect(captured.has(1)).toBe(true);
            expect(captured.has(2)).toBe(true);
            expect(controller.isPinching).toBe(true);

            // Lift pointer 1 -> pinch ends, pointer 2 transitions to pre-threshold drag with inherited capture
            controller.handlePointerUp({ pointerId: 1 } as PointerEvent);
            expect(captured.has(1)).toBe(false);
            expect(captured.has(2)).toBe(true); // Pointer 2 still captured!
            expect(controller.isPinching).toBe(false);
            expect(controller.isDragging).toBe(false); // Sub-threshold

            // Authority change occurs before pointer 2 exceeds drag threshold
            controller.abortForAuthorityChange();

            // Captured pointer 2 must be released explicitly!
            expect(captured.has(2)).toBe(false);
            // No drag end event because drag never exceeded threshold
            const dragEndEvents = events.filter(e => e.source === "drag" && e.phase === "end");
            expect(dragEndEvents.length).toBe(0);
        });

        it("releases all captures when pinch ends with dragPan=false or no valid drag target", () => {
            const captured = new Set<number>();
            const { context } = createMockContext({
                navigationOptions: normalizeChartNavigationOptions({
                    dragPan: false,
                    pinchZoom: true
                }),
                setPointerCapture: (id: number) => captured.add(id),
                releasePointerCapture: (id: number) => captured.delete(id)
            });
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1, pointerType: "touch" } as PointerEvent, { x: 100, y: 150 });
            controller.handlePointerDown({ button: 0, pointerId: 2, pointerType: "touch" } as PointerEvent, { x: 200, y: 150 });
            expect(captured.has(1)).toBe(true);
            expect(captured.has(2)).toBe(true);

            // Lift pointer 1 -> dragPan is false, so remaining pointer 2 must be released!
            controller.handlePointerUp({ pointerId: 1 } as PointerEvent);
            expect(captured.size).toBe(0);
        });

        it("handles lost pointer capture silently for pre-threshold inherited drag", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 150 });
            controller.handlePointerDown({ button: 0, pointerId: 2 } as PointerEvent, { x: 200, y: 150 });
            controller.handlePointerUp({ pointerId: 1 } as PointerEvent);

            // Lost capture on pointer 2 before threshold
            controller.handleLostPointerCapture({ pointerId: 2 } as PointerEvent);

            const dragEvents = events.filter(e => e.source === "drag");
            expect(dragEvents.length).toBe(0);
        });
    });

    describe("Tenth Remediation Dynamic Navigation Policy Authority (PZV10-WP4 / Section 18)", () => {
        it("terminates active drag when dragPan is dynamically disabled while navigation remains enabled", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 100 });
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 150, y: 100 });
            controller.flushPendingFrame();
            expect(controller.isDragging).toBe(true);

            // Dynamically disable dragPan
            controller.updateContext({
                ...context,
                navigationOptions: normalizeChartNavigationOptions({
                    dragPan: false,
                    pan: false,
                    zoom: true
                })
            });

            expect(controller.isDragging).toBe(false);
            const endEvents = events.filter(e => e.source === "drag" && e.phase === "end");
            expect(endEvents.length).toBe(1);
        });

        it("terminates active pinch when pinchZoom is dynamically disabled", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 150 });
            controller.handlePointerDown({ button: 0, pointerId: 2 } as PointerEvent, { x: 200, y: 150 });
            expect(controller.isPinching).toBe(true);

            controller.updateContext({
                ...context,
                navigationOptions: normalizeChartNavigationOptions({
                    pinchZoom: false,
                    wheelZoom: true
                })
            });

            expect(controller.isPinching).toBe(false);
            const endEvents = events.filter(e => e.source === "pinch" && e.phase === "end");
            expect(endEvents.length).toBe(1);
        });

        it("terminates active wheel session and clears timer when wheelZoom or wheelSensitivity changes", () => {
            vi.useFakeTimers();
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handleWheel({ deltaY: -50 } as WheelEvent, { x: 200, y: 150 });
            expect(events.filter(e => e.source === "wheel" && e.phase === "start").length).toBe(1);

            // Update wheelSensitivity mid-session
            controller.updateContext({
                ...context,
                navigationOptions: normalizeChartNavigationOptions({
                    wheelSensitivity: 0.005,
                    wheelZoom: true
                })
            });

            const endEvents = events.filter(e => e.source === "wheel" && e.phase === "end");
            expect(endEvents.length).toBe(1);

            // Ensure timer was cancelled
            vi.advanceTimersByTime(300);
            expect(events.filter(e => e.source === "wheel" && e.phase === "end").length).toBe(1);
            vi.useRealTimers();
        });

        it("terminates active session when clampToData, constraints, or linkGroups change", () => {
            const { context, events } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1 } as PointerEvent, { x: 100, y: 100 });
            controller.handlePointerMove({ pointerId: 1 } as PointerEvent, { x: 150, y: 100 });
            controller.flushPendingFrame();
            expect(controller.isDragging).toBe(true);

            // Change clampToData
            controller.updateContext({
                ...context,
                navigationOptions: normalizeChartNavigationOptions({
                    clampToData: false
                })
            });

            expect(controller.isDragging).toBe(false);
            expect(events.filter(e => e.phase === "end").length).toBe(1);
        });
    });

    describe("Tenth Remediation Pointer Admission (PZV10-WP5 / Section 21)", () => {
        it("rejects non-primary mouse button and does not retain in activePointers", () => {
            const { context } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            // Right click (button = 2)
            const down = controller.handlePointerDown(
                { button: 2, pointerId: 1, pointerType: "mouse" } as PointerEvent,
                { x: 100, y: 100 }
            );

            expect(down).toBe(false);
            expect(controller.activePointersCount).toBe(0);
        });

        it("ignores third+ pointers and does not retain them", () => {
            const { context } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1, pointerType: "touch" } as PointerEvent, { x: 100, y: 150 });
            controller.handlePointerDown({ button: 0, pointerId: 2, pointerType: "touch" } as PointerEvent, { x: 200, y: 150 });
            expect(controller.activePointersCount).toBe(2);

            // Third pointer arriving
            const down3 = controller.handlePointerDown(
                { button: 0, pointerId: 3, pointerType: "touch" } as PointerEvent,
                { x: 300, y: 150 }
            );
            expect(down3).toBe(false);
            expect(controller.activePointersCount).toBe(2);
        });

        it("rolls back to 1-pointer state when second pointer has invalid pinch target", () => {
            const { context } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            // Pointer 1 inside plot
            controller.handlePointerDown({ button: 0, pointerId: 1, pointerType: "touch" } as PointerEvent, { x: 100, y: 150 });
            expect(controller.activePointersCount).toBe(1);

            // Pointer 2 far outside plot causing centroid to have no valid target
            const down2 = controller.handlePointerDown(
                { button: 0, pointerId: 2, pointerType: "touch" } as PointerEvent,
                { x: -500, y: -500 }
            );

            expect(down2).toBe(false);
            expect(controller.activePointersCount).toBe(1); // Pointer 2 was NOT retained!
        });

        it("retains first touch pointer when drag is disabled as a future pinch candidate", () => {
            const { context } = createMockContext({
                navigationOptions: normalizeChartNavigationOptions({
                    dragPan: false,
                    pinchZoom: true
                })
            });
            const controller = new ChartViewportGestureController(context);

            // Touch 1 down: returns false (no drag), but retained in activePointers
            const down1 = controller.handlePointerDown(
                { button: 0, pointerId: 1, pointerType: "touch" } as PointerEvent,
                { x: 100, y: 150 }
            );
            expect(down1).toBe(false);
            expect(controller.activePointersCount).toBe(1);

            // Touch 2 down: starts pinch zoom
            const down2 = controller.handlePointerDown(
                { button: 0, pointerId: 2, pointerType: "touch" } as PointerEvent,
                { x: 200, y: 150 }
            );
            expect(down2).toBe(true);
            expect(controller.isPinching).toBe(true);
        });
    });

    describe("Eleventh Remediation Terminal Pointer State Cleanup (PZV11-002 / PZV11-003)", () => {
        it("deletes active pointer in buttons === 0 started drag recovery and admits subsequent fresh drag", () => {
            const captured = new Set<number>();
            const { context, events } = createMockContext({
                setPointerCapture: (id: number) => captured.add(id),
                releasePointerCapture: (id: number) => captured.delete(id)
            });
            const controller = new ChartViewportGestureController(context);

            // Start drag
            controller.handlePointerDown(
                { button: 0, pointerId: 1, pointerType: "mouse" } as PointerEvent,
                { x: 100, y: 100 }
            );
            expect(controller.activePointersCount).toBe(1);

            // Cross threshold (>= 4px)
            controller.handlePointerMove(
                { button: 0, buttons: 1, pointerId: 1, pointerType: "mouse" } as PointerEvent,
                { x: 150, y: 100 }
            );
            expect(controller.isDragging).toBe(true);
            expect(captured.has(1)).toBe(true);

            // Mouse moves with buttons = 0 (missed pointerup outside canvas)
            const moveRes = controller.handlePointerMove(
                { button: 0, buttons: 0, pointerId: 1, pointerType: "mouse" } as PointerEvent,
                { x: 160, y: 100 }
            );
            expect(moveRes).toBe(false);
            expect(controller.isDragging).toBe(false);
            expect(controller.activePointersCount).toBe(0); // Old pointer MUST be deleted!
            expect(captured.has(1)).toBe(false); // Capture released!

            const endEvents = events.filter(e => e.source === "drag" && e.phase === "end");
            expect(endEvents.length).toBe(1); // Exact 1 end event

            // Fresh primary pointerdown arrives -> must be admitted as pointer #1
            const freshDown = controller.handlePointerDown(
                { button: 0, pointerId: 2, pointerType: "mouse" } as PointerEvent,
                { x: 100, y: 100 }
            );
            expect(freshDown).toBe(true);
            expect(controller.activePointersCount).toBe(1);

            // Fresh drag starts normally
            controller.handlePointerMove(
                { button: 0, buttons: 1, pointerId: 2, pointerType: "mouse" } as PointerEvent,
                { x: 130, y: 100 }
            );
            expect(controller.isDragging).toBe(true);
        });

        it("clears active pointers on navigation transform policy changes during active drag", () => {
            const captured = new Set<number>();
            const { context, events } = createMockContext({
                setPointerCapture: (id: number) => captured.add(id),
                releasePointerCapture: (id: number) => captured.delete(id)
            });
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown(
                { button: 0, pointerId: 1, pointerType: "mouse" } as PointerEvent,
                { x: 100, y: 100 }
            );
            controller.handlePointerMove(
                { button: 0, buttons: 1, pointerId: 1, pointerType: "mouse" } as PointerEvent,
                { x: 150, y: 100 }
            );
            expect(controller.isDragging).toBe(true);
            expect(controller.activePointersCount).toBe(1);

            // Change navigation policy: dragPan = false
            controller.updateContext({
                ...context,
                navigationOptions: normalizeChartNavigationOptions({
                    dragPan: false,
                    pinchZoom: true
                })
            });

            expect(controller.isDragging).toBe(false);
            expect(controller.activePointersCount).toBe(0); // Active pointers retired!
            expect(captured.has(1)).toBe(false);

            const endEvents = events.filter(e => e.source === "drag" && e.phase === "end");
            expect(endEvents.length).toBe(1);

            // Re-enable policy and admit fresh pointer
            controller.updateContext({
                ...context,
                navigationOptions: normalizeChartNavigationOptions({
                    dragPan: true,
                    pinchZoom: true
                })
            });

            const freshDown = controller.handlePointerDown(
                { button: 0, pointerId: 3, pointerType: "mouse" } as PointerEvent,
                { x: 100, y: 100 }
            );
            expect(freshDown).toBe(true);
            expect(controller.activePointersCount).toBe(1);
        });

        it("clears active pointers on navigation policy changes during active pinch", () => {
            const captured = new Set<number>();
            const { context, events } = createMockContext({
                setPointerCapture: (id: number) => captured.add(id),
                releasePointerCapture: (id: number) => captured.delete(id)
            });
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown(
                { button: 0, pointerId: 1, pointerType: "touch" } as PointerEvent,
                { x: 100, y: 150 }
            );
            controller.handlePointerDown(
                { button: 0, pointerId: 2, pointerType: "touch" } as PointerEvent,
                { x: 200, y: 150 }
            );
            expect(controller.isPinching).toBe(true);
            expect(controller.activePointersCount).toBe(2);

            // Change policy: pinchZoom = false
            controller.updateContext({
                ...context,
                navigationOptions: normalizeChartNavigationOptions({
                    pinchZoom: false,
                    wheelZoom: true
                })
            });

            expect(controller.isPinching).toBe(false);
            expect(controller.activePointersCount).toBe(0); // Both pointers retired!
            expect(captured.size).toBe(0);

            const endEvents = events.filter(e => e.source === "pinch" && e.phase === "end");
            expect(endEvents.length).toBe(1);
        });
    });

    describe("Twelfth Remediation Click Suppression Sequence Lifetime (PZV12-001)", () => {
        it("retires stale click suppression on fresh pointerdown when dragPan is dynamically disabled", () => {
            const { context } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            // 1. Start drag and cross threshold
            controller.handlePointerDown({ button: 0, pointerId: 1, pointerType: "mouse" } as PointerEvent, { x: 100, y: 100 });
            controller.handlePointerMove({ button: 0, buttons: 1, pointerId: 1, pointerType: "mouse" } as PointerEvent, { x: 150, y: 100 });
            expect(controller.isDragging).toBe(true);
            expect(controller.isClickSuppressed).toBe(true);

            // 2. Dynamically disable dragPan while navigation remains enabled
            controller.updateContext({
                ...context,
                navigationOptions: normalizeChartNavigationOptions({
                    dragPan: false,
                    pinchZoom: true
                })
            });
            expect(controller.isDragging).toBe(false);
            expect(controller.isClickSuppressed).toBe(true); // Suppression armed for old sequence

            // 3. Old sequence ends (pointerup)
            controller.handlePointerUp({ pointerId: 1, pointerType: "mouse" } as PointerEvent);
            expect(controller.isClickSuppressed).toBe(true); // Still armed if synthetic click arrives

            // 4. Fresh pointer sequence begins (e.g. mouse click on data point)
            // Even though dragPan is false and handlePointerDown returns false, suppression is retired!
            const admitted = controller.handlePointerDown({ button: 0, pointerId: 2, pointerType: "mouse" } as PointerEvent, { x: 100, y: 100 });
            expect(admitted).toBe(false);
            expect(controller.isClickSuppressed).toBe(false); // Stale suppression retired!
            expect(controller.consumeClickSuppression()).toBe(false);
        });

        it("retires stale click suppression on fresh single-touch pointerdown in pinch-only configuration", () => {
            const { context } = createMockContext({
                navigationOptions: normalizeChartNavigationOptions({
                    dragPan: false,
                    pinchZoom: true
                })
            });
            const controller = new ChartViewportGestureController(context);

            // 1. Perform 2-finger pinch
            controller.handlePointerDown({ button: 0, pointerId: 1, pointerType: "touch" } as PointerEvent, { x: 100, y: 150 });
            controller.handlePointerDown({ button: 0, pointerId: 2, pointerType: "touch" } as PointerEvent, { x: 200, y: 150 });
            expect(controller.isPinching).toBe(true);
            expect(controller.isClickSuppressed).toBe(true);

            // 2. Pinch ends (both touch pointers lifted)
            controller.handlePointerUp({ pointerId: 1, pointerType: "touch" } as PointerEvent);
            controller.handlePointerUp({ pointerId: 2, pointerType: "touch" } as PointerEvent);
            expect(controller.isClickSuppressed).toBe(true); // Armed for old sequence

            // 3. Fresh single-finger tap arrives (touch pointer retained only as future pinch candidate)
            controller.handlePointerDown({ button: 0, pointerId: 3, pointerType: "touch" } as PointerEvent, { x: 120, y: 150 });
            expect(controller.isClickSuppressed).toBe(false); // Retired on fresh pointer sequence!
            expect(controller.consumeClickSuppression()).toBe(false);
        });

        it("preserves same-sequence synthetic click suppression when no new pointerdown arrives", () => {
            const { context } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1, pointerType: "mouse" } as PointerEvent, { x: 100, y: 100 });
            controller.handlePointerMove({ button: 0, buttons: 1, pointerId: 1, pointerType: "mouse" } as PointerEvent, { x: 150, y: 100 });
            controller.handlePointerUp({ pointerId: 1, pointerType: "mouse" } as PointerEvent);

            expect(controller.consumeClickSuppression()).toBe(true); // First consume swallows synthetic click
            expect(controller.consumeClickSuppression()).toBe(false); // Subsequent consume returns false
        });

        it("preserves suppression across authority abort until fresh pointerdown arrives", () => {
            const { context } = createMockContext();
            const controller = new ChartViewportGestureController(context);

            controller.handlePointerDown({ button: 0, pointerId: 1, pointerType: "mouse" } as PointerEvent, { x: 100, y: 100 });
            controller.handlePointerMove({ button: 0, buttons: 1, pointerId: 1, pointerType: "mouse" } as PointerEvent, { x: 150, y: 100 });
            expect(controller.isClickSuppressed).toBe(true);

            // Authority change aborts gesture
            controller.abortForAuthorityChange();
            expect(controller.isClickSuppressed).toBe(true);

            // Fresh pointer down arrives
            controller.handlePointerDown({ button: 0, pointerId: 2, pointerType: "mouse" } as PointerEvent, { x: 100, y: 100 });
            // Since it's a fresh drag candidate, suppression was retired at start of handlePointerDown
            expect(controller.isClickSuppressed).toBe(false);
        });

        it("does not clear suppression when second pointer arrives for pinch in same sequence", () => {
            const { context } = createMockContext({
                navigationOptions: normalizeChartNavigationOptions({
                    dragPan: true,
                    pinchZoom: true
                })
            });
            const controller = new ChartViewportGestureController(context);

            // 1st pointer touches
            controller.handlePointerDown({ button: 0, pointerId: 1, pointerType: "touch" } as PointerEvent, { x: 100, y: 150 });
            // 2nd pointer touches -> same physical sequence, starts pinch and arms click suppression
            controller.handlePointerDown({ button: 0, pointerId: 2, pointerType: "touch" } as PointerEvent, { x: 200, y: 150 });
            expect(controller.isPinching).toBe(true);
            expect(controller.isClickSuppressed).toBe(true);
        });
    });
});
