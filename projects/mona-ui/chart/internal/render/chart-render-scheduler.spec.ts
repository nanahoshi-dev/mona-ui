import { describe, expect, it, vi } from "vitest";
import { ChartInvalidationReason } from "../context/chart-registration-context";
import { ChartRenderScheduler } from "./chart-render-scheduler";

describe("ChartRenderScheduler", () => {
    it("should schedule callback and flush accumulated reasons via requestAnimationFrame", async () => {
        let capturedReason: ChartInvalidationReason | null = null;
        const callback = vi.fn((reason: ChartInvalidationReason) => {
            capturedReason = reason;
        });

        const scheduler = new ChartRenderScheduler(callback);
        scheduler.schedule(ChartInvalidationReason.Data);
        scheduler.schedule(ChartInvalidationReason.Style);

        expect(callback).not.toHaveBeenCalled();

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(callback).toHaveBeenCalledTimes(1);
        expect(capturedReason).toBe(ChartInvalidationReason.Data | ChartInvalidationReason.Style);
    });

    it("should cancel scheduled animation frame without invoking callback", async () => {
        const callback = vi.fn();
        const scheduler = new ChartRenderScheduler(callback);

        scheduler.schedule(ChartInvalidationReason.Layout);
        scheduler.cancel();

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(callback).not.toHaveBeenCalled();
    });
});
