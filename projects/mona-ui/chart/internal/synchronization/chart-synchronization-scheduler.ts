import type { SynchronizationDeliveryChannel, SynchronizationMessageKind } from "./chart-synchronization-types";

export type SynchronizationDeliveryKind = SynchronizationDeliveryChannel;

export interface PendingSynchronizationDelivery {
    readonly channel?: SynchronizationDeliveryChannel;
    deliver(): void;
    readonly group: string;
    readonly kind: SynchronizationDeliveryKind;
    readonly messageKind?: SynchronizationMessageKind;
    readonly originMemberId: string;
    readonly recipientMemberId: string;
    readonly sequence: number;
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
    readonly #pending = new Map<string, PendingSynchronizationDelivery>();
    #frameHandle: number | null = null;
    public constructor(onCoalesced?: () => void) {
        this.#host = resolveFrameSchedulerHost();
        this.#onCoalesced = onCoalesced;
    }

    public cancel(key: string): boolean {
        return this.#pending.delete(key);
    }

    public cancelByOrigin(originMemberId: string, channel?: SynchronizationDeliveryChannel): number {
        let count = 0;
        for (const [key, item] of this.#pending.entries()) {
            const itemChannel = item.channel ?? item.kind;
            if (item.originMemberId === originMemberId && (!channel || itemChannel === channel)) {
                this.#pending.delete(key);
                count++;
            }
        }
        return count;
    }

    public cancelByRecipient(recipientMemberId: string, channel?: SynchronizationDeliveryChannel): number {
        let count = 0;
        for (const [key, item] of this.#pending.entries()) {
            const itemChannel = item.channel ?? item.kind;
            if (item.recipientMemberId === recipientMemberId && (!channel || itemChannel === channel)) {
                this.#pending.delete(key);
                count++;
            }
        }
        return count;
    }

    public cancelGroupChannel(group: string, channel: SynchronizationDeliveryChannel): number {
        let count = 0;
        for (const [key, item] of this.#pending.entries()) {
            const itemChannel = item.channel ?? item.kind;
            if (item.group === group && itemChannel === channel) {
                this.#pending.delete(key);
                count++;
            }
        }
        return count;
    }

    public cancelOriginGroup(originMemberId: string, group: string, channel?: SynchronizationDeliveryChannel): number {
        let count = 0;
        for (const [key, item] of this.#pending.entries()) {
            const itemChannel = item.channel ?? item.kind;
            if (
                item.originMemberId === originMemberId &&
                item.group === group &&
                (!channel || itemChannel === channel)
            ) {
                this.#pending.delete(key);
                count++;
            }
        }
        return count;
    }

    public cancelRecipientGroup(
        recipientMemberId: string,
        group: string,
        channel?: SynchronizationDeliveryChannel
    ): number {
        let count = 0;
        for (const [key, item] of this.#pending.entries()) {
            const itemChannel = item.channel ?? item.kind;
            if (
                item.recipientMemberId === recipientMemberId &&
                item.group === group &&
                (!channel || itemChannel === channel)
            ) {
                this.#pending.delete(key);
                count++;
            }
        }
        return count;
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

    public schedule(delivery: PendingSynchronizationDelivery): void {
        const channel = delivery.channel ?? delivery.kind;
        const key = `${delivery.group}:${delivery.recipientMemberId}:${channel}`;
        const existing = this.#pending.get(key);
        if (existing) {
            this.#pending.set(key, delivery);
            this.#onCoalesced?.();
            return;
        }
        this.#pending.set(key, delivery);
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
