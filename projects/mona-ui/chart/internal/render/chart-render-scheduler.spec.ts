import { describe, expect, it, vi } from "vitest";
import { ChartInvalidationReason } from "../context/chart-registration-context";
import { ChartRenderScheduler } from "./chart-render-scheduler";

describe("ChartRenderScheduler", () => {
    it("should schedule callback and flush accumulated reasons via frame runner", () => {
        let capturedReason: ChartInvalidationReason | null = null;
        const callback = vi.fn((reason: ChartInvalidationReason) => {
            capturedReason = reason;
        });

        let frameCallback: (() => void) | undefined;
        const requestFrame = vi.fn((cb: () => void) => {
            frameCallback = cb;
            return 42;
        });
        const cancelFrame = vi.fn();

        const scheduler = new ChartRenderScheduler(callback, requestFrame, cancelFrame);
        scheduler.schedule(ChartInvalidationReason.Data);
        scheduler.schedule(ChartInvalidationReason.Style);

        expect(callback).not.toHaveBeenCalled();
        expect(requestFrame).toHaveBeenCalledTimes(1);

        if (frameCallback) {
            (frameCallback as () => void)();
        }

        expect(callback).toHaveBeenCalledTimes(1);
        expect(capturedReason).toBe(ChartInvalidationReason.Data | ChartInvalidationReason.Style);
    });

    it("should cancel scheduled frame without invoking callback", () => {
        const callback = vi.fn();
        let frameCallback: (() => void) | undefined;
        const requestFrame = vi.fn((cb: () => void) => {
            frameCallback = cb;
            return 99;
        });
        const cancelFrame = vi.fn();

        const scheduler = new ChartRenderScheduler(callback, requestFrame, cancelFrame);

        scheduler.schedule(ChartInvalidationReason.Layout);
        expect(requestFrame).toHaveBeenCalledTimes(1);

        scheduler.cancel();
        expect(cancelFrame).toHaveBeenCalledWith(99);

        if (frameCallback) {
            (frameCallback as () => void)();
        }
        expect(callback).not.toHaveBeenCalled();
    });

    it("should flush pending invalidation synchronously on flush() and cancel pending frame", () => {
        let capturedReason: ChartInvalidationReason | null = null;
        const callback = vi.fn((reason: ChartInvalidationReason) => {
            capturedReason = reason;
        });

        const requestFrame = vi.fn(() => 101);
        const cancelFrame = vi.fn();

        const scheduler = new ChartRenderScheduler(callback, requestFrame, cancelFrame);
        scheduler.schedule(ChartInvalidationReason.Data);
        scheduler.schedule(ChartInvalidationReason.Layout);

        expect(callback).not.toHaveBeenCalled();
        expect(requestFrame).toHaveBeenCalledTimes(1);

        scheduler.flush();

        expect(cancelFrame).toHaveBeenCalledWith(101);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(capturedReason).toBe(ChartInvalidationReason.Data | ChartInvalidationReason.Layout);
    });
});
