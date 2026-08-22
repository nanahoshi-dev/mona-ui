type SynchronizationDeliveryKind = "crosshair" | "viewport";

interface PendingSynchronizationDelivery {
    deliver(): void;
    readonly kind: SynchronizationDeliveryKind;
}

interface FrameSchedulerHost {
    cancelAnimationFrame(handle: number): void;
    requestAnimationFrame(callback: () => void): number;
}

function resolveFrameSchedulerHost(): FrameSchedulerHost | null {
    const candidate = globalThis as {
        cancelAnimationFrame?: (handle: number) => void;
        requestAnimationFrame?: (callback: (time: number) => void) => number;
    };
    if (typeof candidate.requestAnimationFrame === "function" && typeof candidate.cancelAnimationFrame === "function") {
        const raf = candidate.requestAnimationFrame.bind(candidate);
        const caf = candidate.cancelAnimationFrame.bind(candidate);
        return {
            cancelAnimationFrame: handle => caf(handle),
            requestAnimationFrame: callback => raf(() => callback())
        };
    }
    return null;
}

export class ChartSynchronizationScheduler {
    readonly #host: FrameSchedulerHost | null;
    readonly #onCoalesced?: () => void;
    #frameHandle: number | null = null;
    readonly #pending = new Map<string, PendingSynchronizationDelivery>();

    public constructor(onCoalesced?: () => void) {
        this.#host = resolveFrameSchedulerHost();
        this.#onCoalesced = onCoalesced;
    }

    public cancel(key: string): boolean {
        return this.#pending.delete(key);
    }

    public destroy(): void {
        this.cancelFlush();
        this.#pending.clear();
    }

    public get pendingCount(): number {
        return this.#pending.size;
    }

    public flushNow(): void {
        this.cancelFlush();
        this.deliverPending();
    }

    public schedule(key: string, kind: SynchronizationDeliveryKind, deliver: () => void): void {
        const existing = this.#pending.get(key);
        if (existing) {
            this.#pending.set(key, { deliver, kind });
            this.#onCoalesced?.();
            return;
        }
        this.#pending.set(key, { deliver, kind });
        if (this.#frameHandle !== null) {
            return;
        }
        if (this.#host) {
            this.#frameHandle = this.#host.requestAnimationFrame(() => {
                this.#frameHandle = null;
                this.deliverPending();
            });
        } else {
            this.#frameHandle = -1;
            queueMicrotask(() => {
                this.#frameHandle = null;
                this.deliverPending();
            });
        }
    }

    private cancelFlush(): void {
        if (this.#frameHandle !== null && this.#frameHandle >= 0 && this.#host) {
            this.#host.cancelAnimationFrame(this.#frameHandle);
        }
        this.#frameHandle = null;
    }

    private deliverPending(): void {
        if (this.#pending.size === 0) {
            return;
        }
        const deliveries = Array.from(this.#pending.values());
        this.#pending.clear();
        for (const delivery of deliveries) {
            delivery.deliver();
        }
    }
}
