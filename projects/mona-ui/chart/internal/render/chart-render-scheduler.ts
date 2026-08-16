import { ChartInvalidationReason } from "../context/chart-registration-context";

export class ChartRenderScheduler {
    readonly #callback: (reason: ChartInvalidationReason) => void;
    #frameId: number | null = null;
    #pendingReason: number = 0;

    public constructor(callback: (reason: ChartInvalidationReason) => void) {
        this.#callback = callback;
    }

    public cancel(): void {
        if (this.#frameId !== null && typeof window !== "undefined") {
            window.cancelAnimationFrame(this.#frameId);
            this.#frameId = null;
        }
        this.#pendingReason = 0;
    }

    public schedule(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        this.#pendingReason |= reason;

        if (typeof window === "undefined") {
            // SSR or non-browser environment
            const accumulatedReason = this.#pendingReason;
            this.#pendingReason = 0;
            this.#callback(accumulatedReason as ChartInvalidationReason);
            return;
        }

        if (this.#frameId !== null) {
            return;
        }

        this.#frameId = window.requestAnimationFrame(() => {
            this.#frameId = null;
            const accumulatedReason = this.#pendingReason;
            this.#pendingReason = 0;
            this.#callback(accumulatedReason as ChartInvalidationReason);
        });
    }
}
