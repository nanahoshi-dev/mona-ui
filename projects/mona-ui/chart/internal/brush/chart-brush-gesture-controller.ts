import type {
    ChartBrushActivation,
    ChartBrushMode,
    ChartBrushPhase
} from "../../models/chart-brush.models";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartBrushRegistration } from "../context/chart-registration-context";

export interface BrushSession {
    readonly activation: ChartBrushActivation;
    latestPoint: ChartPoint;
    readonly minDragDistance: number;
    readonly mode: ChartBrushMode;
    readonly pointerId: number;
    readonly startPoint: ChartPoint;
    thresholdMet: boolean;
}

export interface BrushGestureResult {
    readonly bounds: ChartRect;
    readonly phase: ChartBrushPhase;
}

export class ChartBrushGestureController {
    #session: BrushSession | null = null;

    public get isBrushing(): boolean {
        return this.#session !== null && this.#session.thresholdMet;
    }

    public get activeSession(): BrushSession | null {
        return this.#session;
    }

    static #getCoordinates(event: PointerEvent, element?: HTMLElement): ChartPoint {
        if (element) {
            const rect = element.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }
        if (typeof event.offsetX === "number" && !isNaN(event.offsetX) && event.offsetX !== 0) {
            return { x: event.offsetX, y: event.offsetY };
        }
        return { x: event.clientX ?? 0, y: event.clientY ?? 0 };
    }

    public onPointerDown(
        event: PointerEvent,
        plotRect: ChartRect,
        registration: ChartBrushRegistration,
        element?: HTMLElement
    ): boolean {
        if (this.#session !== null) {
            return false;
        }

        if (!registration.enabled?.()) {
            return false;
        }

        if (event.button !== 0) {
            return false;
        }

        if (event.pointerType === "touch") {
            return false;
        }

        if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
            return false;
        }

        const activation = registration.activation?.() ?? "shift-drag";
        if (activation === "shift-drag" && !event.shiftKey) {
            return false;
        }

        const coords = ChartBrushGestureController.#getCoordinates(event, element);
        const tolerance = 1;

        if (
            coords.x < plotRect.x - tolerance ||
            coords.x > plotRect.x + plotRect.width + tolerance ||
            coords.y < plotRect.y - tolerance ||
            coords.y > plotRect.y + plotRect.height + tolerance
        ) {
            return false;
        }

        const clampedStart: ChartPoint = {
            x: Math.max(plotRect.x, Math.min(plotRect.x + plotRect.width, coords.x)),
            y: Math.max(plotRect.y, Math.min(plotRect.y + plotRect.height, coords.y))
        };

        const minDragDistance = Math.max(0, registration.minDragDistance?.() ?? 4);
        const mode = registration.mode?.() ?? "xy";

        this.#session = {
            activation,
            latestPoint: clampedStart,
            minDragDistance,
            mode,
            pointerId: event.pointerId,
            startPoint: clampedStart,
            thresholdMet: false
        };

        if (element && typeof element.setPointerCapture === "function") {
            try {
                element.setPointerCapture(event.pointerId);
            } catch {
                // Ignore in synthetic/headless environments
            }
        }

        return true;
    }

    public onPointerMove(
        event: PointerEvent,
        plotRect: ChartRect,
        element?: HTMLElement
    ): BrushGestureResult | null {
        if (!this.#session || this.#session.pointerId !== event.pointerId) {
            return null;
        }

        const coords = ChartBrushGestureController.#getCoordinates(event, element);
        const clampedPoint: ChartPoint = {
            x: Math.max(plotRect.x, Math.min(plotRect.x + plotRect.width, coords.x)),
            y: Math.max(plotRect.y, Math.min(plotRect.y + plotRect.height, coords.y))
        };

        this.#session.latestPoint = clampedPoint;

        const dx = clampedPoint.x - this.#session.startPoint.x;
        const dy = clampedPoint.y - this.#session.startPoint.y;
        let dist = 0;
        switch (this.#session.mode) {
            case "x":
                dist = Math.abs(dx);
                break;
            case "y":
                dist = Math.abs(dy);
                break;
            case "xy":
            default:
                dist = Math.hypot(dx, dy);
                break;
        }

        if (!this.#session.thresholdMet) {
            if (dist >= this.#session.minDragDistance) {
                this.#session.thresholdMet = true;
                if (element && typeof element.setPointerCapture === "function") {
                    try {
                        element.setPointerCapture(event.pointerId);
                    } catch {
                        // Ignore pointer capture errors in synthetic/headless environments
                    }
                }
                const bounds = this.computeBounds(this.#session.startPoint, clampedPoint, this.#session.mode, plotRect);
                return { bounds, phase: "start" };
            }
            return null;
        }

        const bounds = this.computeBounds(this.#session.startPoint, clampedPoint, this.#session.mode, plotRect);
        return { bounds, phase: "update" };
    }

    public onPointerUp(
        event: PointerEvent,
        plotRect: ChartRect,
        element?: HTMLElement
    ): BrushGestureResult | null {
        if (!this.#session || this.#session.pointerId !== event.pointerId) {
            return null;
        }

        const session = this.#session;
        this.#session = null;

        if (element && typeof element.releasePointerCapture === "function") {
            try {
                element.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore capture release error
            }
        }

        if (session.thresholdMet) {
            const coords = ChartBrushGestureController.#getCoordinates(event, element);
            const clampedPoint: ChartPoint = {
                x: Math.max(plotRect.x, Math.min(plotRect.x + plotRect.width, coords.x)),
                y: Math.max(plotRect.y, Math.min(plotRect.y + plotRect.height, coords.y))
            };
            const bounds = this.computeBounds(session.startPoint, clampedPoint, session.mode, plotRect);
            return { bounds, phase: "end" };
        }

        return null;
    }

    public onPointerLeave(event?: PointerEvent): boolean {
        if (!this.#session) {
            return false;
        }
        if (event && this.#session.pointerId !== event.pointerId) {
            return false;
        }
        if (!this.#session.thresholdMet) {
            this.#session = null;
            return false;
        }
        return true;
    }

    public cancel(element?: HTMLElement): boolean {
        if (!this.#session) {
            return false;
        }

        const wasBrushing = this.#session.thresholdMet;
        const pointerId = this.#session.pointerId;
        this.#session = null;

        if (element && typeof element.releasePointerCapture === "function") {
            try {
                element.releasePointerCapture(pointerId);
            } catch {
                // Ignore
            }
        }

        return wasBrushing;
    }

    public computeBounds(
        p1: ChartPoint,
        p2: ChartPoint,
        mode: ChartBrushMode,
        plotRect: ChartRect
    ): ChartRect {
        const minX = Math.max(plotRect.x, Math.min(p1.x, p2.x));
        const maxX = Math.min(plotRect.x + plotRect.width, Math.max(p1.x, p2.x));
        const minY = Math.max(plotRect.y, Math.min(p1.y, p2.y));
        const maxY = Math.min(plotRect.y + plotRect.height, Math.max(p1.y, p2.y));

        switch (mode) {
            case "x":
                return {
                    height: plotRect.height,
                    width: Math.max(1, maxX - minX),
                    x: minX,
                    y: plotRect.y
                };
            case "y":
                return {
                    height: Math.max(1, maxY - minY),
                    width: plotRect.width,
                    x: plotRect.x,
                    y: minY
                };
            case "xy":
            default:
                return {
                    height: Math.max(1, maxY - minY),
                    width: Math.max(1, maxX - minX),
                    x: minX,
                    y: minY
                };
        }
    }
}
