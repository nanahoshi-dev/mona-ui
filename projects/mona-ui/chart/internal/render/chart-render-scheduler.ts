import { ChartInvalidationReason } from "../context/chart-registration-context";

export type FrameSchedulerRequest = (callback: () => void) => number;
export type FrameSchedulerCancel = (handle: number) => void;

export class ChartRenderScheduler {
    readonly #callback: (reason: ChartInvalidationReason) => void;
    readonly #cancelFrame: FrameSchedulerCancel;
    readonly #requestFrame: FrameSchedulerRequest;
    #frameId: number | null = null;
    #pendingReason: number = 0;

    public constructor(
        callback: (reason: ChartInvalidationReason) => void,
        requestFrame?: FrameSchedulerRequest,
        cancelFrame?: FrameSchedulerCancel
    ) {
        this.#callback = callback;
        this.#requestFrame =
            requestFrame ??
            (typeof requestAnimationFrame === "function"
                ? requestAnimationFrame.bind(globalThis)
                : cb => setTimeout(cb, 16) as unknown as number);
        this.#cancelFrame =
            cancelFrame ??
            (typeof cancelAnimationFrame === "function"
                ? cancelAnimationFrame.bind(globalThis)
                : handle => clearTimeout(handle));
    }

    public cancel(): void {
        if (this.#frameId !== null) {
            this.#cancelFrame(this.#frameId);
            this.#frameId = null;
        }
        this.#pendingReason = 0;
    }

    public consume(reason: ChartInvalidationReason): void {
        this.#pendingReason &= ~reason;
        if (this.#pendingReason === 0 && this.#frameId !== null) {
            this.#cancelFrame(this.#frameId);
            this.#frameId = null;
        }
    }

    public flush(): void {
        if (this.#frameId !== null) {
            this.#cancelFrame(this.#frameId);
            this.#frameId = null;
        }
        if (this.#pendingReason !== 0) {
            const accumulatedReason = this.#pendingReason;
            this.#pendingReason = 0;
            this.#callback(accumulatedReason as ChartInvalidationReason);
        }
    }

    public flushStructural(): void {
        const structuralMask =
            ChartInvalidationReason.Data |
            ChartInvalidationReason.Layout |
            ChartInvalidationReason.Size |
            ChartInvalidationReason.Visibility |
            ChartInvalidationReason.Style |
            ChartInvalidationReason.Chrome;

        const structuralReason = this.#pendingReason & structuralMask;
        if (structuralReason === 0) {
            return;
        }

        this.#pendingReason &= ~structuralMask;
        this.#callback(structuralReason as ChartInvalidationReason);
    }

    public flushWithDefault(defaultReason: ChartInvalidationReason): void {
        if (this.#frameId !== null) {
            this.#cancelFrame(this.#frameId);
            this.#frameId = null;
        }
        const accumulatedReason = this.#pendingReason !== 0 ? this.#pendingReason | defaultReason : defaultReason;
        this.#pendingReason = 0;
        this.#callback(accumulatedReason as ChartInvalidationReason);
    }

    public hasPending(reasonMask?: number): boolean {
        if (reasonMask === undefined) {
            return this.#pendingReason !== 0;
        }
        return (this.#pendingReason & reasonMask) !== 0;
    }

    public schedule(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        this.#pendingReason |= reason;

        if (this.#frameId !== null) {
            return;
        }

        this.#frameId = this.#requestFrame(() => {
            this.#frameId = null;
            if (this.#pendingReason !== 0) {
                const accumulatedReason = this.#pendingReason;
                this.#pendingReason = 0;
                this.#callback(accumulatedReason as ChartInvalidationReason);
            }
        });
    }
}
