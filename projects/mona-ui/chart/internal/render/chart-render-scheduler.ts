import { ChartInvalidationReason } from "../context/chart-registration-context";

export class ChartRenderScheduler {
    readonly #callback: (reason: ChartInvalidationReason) => void;
    #scheduled: boolean = false;
    #pendingReason: number = 0;

    public constructor(callback: (reason: ChartInvalidationReason) => void) {
        this.#callback = callback;
    }

    public cancel(): void {
        this.#scheduled = false;
        this.#pendingReason = 0;
    }

    public flush(): void {
        if (this.#scheduled || this.#pendingReason !== 0) {
            this.#scheduled = false;
            const accumulatedReason = this.#pendingReason;
            this.#pendingReason = 0;
            this.#callback(accumulatedReason as ChartInvalidationReason);
        }
    }

    public schedule(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        this.#pendingReason |= reason;

        if (this.#scheduled) {
            return;
        }

        this.#scheduled = true;
        if (typeof queueMicrotask === "function") {
            queueMicrotask(() => {
                if (!this.#scheduled) {
                    return;
                }
                this.#scheduled = false;
                const accumulatedReason = this.#pendingReason;
                this.#pendingReason = 0;
                this.#callback(accumulatedReason as ChartInvalidationReason);
            });
        } else {
            Promise.resolve().then(() => {
                if (!this.#scheduled) {
                    return;
                }
                this.#scheduled = false;
                const accumulatedReason = this.#pendingReason;
                this.#pendingReason = 0;
                this.#callback(accumulatedReason as ChartInvalidationReason);
            });
        }
    }
}
