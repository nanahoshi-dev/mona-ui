import { describe, expect, it } from "vitest";
import { ChartBrushGestureController } from "./chart-brush-gesture-controller";
import type { ChartBrushRegistration } from "../context/chart-registration-context";
import { signal } from "@angular/core";

describe("ChartBrushGestureController", () => {
    const plotRect = { x: 50, y: 50, width: 400, height: 300 };

    it("should start candidate session on pointerdown inside plotRect", () => {
        const controller = new ChartBrushGestureController();
        const reg: Partial<ChartBrushRegistration> = {
            activation: signal("drag"),
            enabled: signal(true),
            mode: signal("xy")
        };

        const downEvt = new PointerEvent("pointerdown", {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
            shiftKey: false
        });

        const started = controller.onPointerDown(downEvt, plotRect, reg as ChartBrushRegistration);
        expect(started).toBe(true);
        expect(controller.activeSession).not.toBeNull();
    });

    it("should not start if pointer is outside plotRect", () => {
        const controller = new ChartBrushGestureController();
        const reg: Partial<ChartBrushRegistration> = {
            activation: signal("drag"),
            enabled: signal(true),
            mode: signal("xy")
        };

        const downEvt = new PointerEvent("pointerdown", {
            clientX: 10,
            clientY: 10,
            pointerId: 1
        });

        const started = controller.onPointerDown(downEvt, plotRect, reg as ChartBrushRegistration);
        expect(started).toBe(false);
        expect(controller.activeSession).toBeNull();
    });

    it("should require shift key if activation is shift-drag", () => {
        const controller = new ChartBrushGestureController();
        const reg: Partial<ChartBrushRegistration> = {
            activation: signal("shift-drag"),
            enabled: signal(true),
            mode: signal("xy")
        };

        const noShiftEvt = new PointerEvent("pointerdown", {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
            shiftKey: false
        });
        expect(controller.onPointerDown(noShiftEvt, plotRect, reg as ChartBrushRegistration)).toBe(false);

        const shiftEvt = new PointerEvent("pointerdown", {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
            shiftKey: true
        });
        expect(controller.onPointerDown(shiftEvt, plotRect, reg as ChartBrushRegistration)).toBe(true);
    });

    it("should emit start phase when drag exceeds minDragDistance (4px)", () => {
        const controller = new ChartBrushGestureController();
        const reg: Partial<ChartBrushRegistration> = {
            activation: signal("drag"),
            enabled: signal(true),
            mode: signal("xy")
        };

        const downEvt = new PointerEvent("pointerdown", {
            clientX: 100,
            clientY: 100,
            pointerId: 1
        });
        controller.onPointerDown(downEvt, plotRect, reg as ChartBrushRegistration);

        // Small move (< 4px) should not trigger start
        const moveSmall = new PointerEvent("pointermove", {
            clientX: 102,
            clientY: 102,
            pointerId: 1
        });
        expect(controller.onPointerMove(moveSmall, plotRect)).toBeNull();

        // Move > 4px triggers start
        const moveLarge = new PointerEvent("pointermove", {
            clientX: 120,
            clientY: 130,
            pointerId: 1
        });
        const r1 = controller.onPointerMove(moveLarge, plotRect);
        expect(r1).not.toBeNull();
        expect(r1?.phase).toBe("start");
        expect(r1?.bounds.x).toBe(100);
        expect(r1?.bounds.y).toBe(100);
        expect(r1?.bounds.width).toBe(20);
        expect(r1?.bounds.height).toBe(30);

        // Subsequent move triggers update phase
        const moveNext = new PointerEvent("pointermove", {
            clientX: 140,
            clientY: 150,
            pointerId: 1
        });
        const r2 = controller.onPointerMove(moveNext, plotRect);
        expect(r2?.phase).toBe("update");
        expect(r2?.bounds.width).toBe(40);
        expect(r2?.bounds.height).toBe(50);
    });

    it("should complete on pointerup", () => {
        const controller = new ChartBrushGestureController();
        const reg: Partial<ChartBrushRegistration> = {
            activation: signal("drag"),
            enabled: signal(true),
            mode: signal("xy")
        };

        controller.onPointerDown(new PointerEvent("pointerdown", { clientX: 100, clientY: 100, pointerId: 1 }), plotRect, reg as ChartBrushRegistration);
        controller.onPointerMove(new PointerEvent("pointermove", { clientX: 150, clientY: 150, pointerId: 1 }), plotRect);

        const upEvt = new PointerEvent("pointerup", { clientX: 150, clientY: 150, pointerId: 1 });
        const upRes = controller.onPointerUp(upEvt, plotRect);
        expect(upRes).not.toBeNull();
        expect(upRes?.phase).toBe("end");
        expect(controller.activeSession).toBeNull();
    });

    it("should handle cancel cleanly", () => {
        const controller = new ChartBrushGestureController();
        const reg: Partial<ChartBrushRegistration> = {
            activation: signal("drag"),
            enabled: signal(true),
            mode: signal("xy")
        };

        controller.onPointerDown(new PointerEvent("pointerdown", { clientX: 100, clientY: 100, pointerId: 1 }), plotRect, reg as ChartBrushRegistration);
        controller.onPointerMove(new PointerEvent("pointermove", { clientX: 150, clientY: 150, pointerId: 1 }), plotRect);

        const cancelled = controller.cancel();
        expect(cancelled).toBe(true);
        expect(controller.activeSession).toBeNull();
    });
});
