export interface ChartAnimationClock {
    cancelFrame(id: number): void;
    now(): number;
    requestFrame(callback: FrameRequestCallback): number;
}

export class BrowserAnimationClock implements ChartAnimationClock {
    public cancelFrame(id: number): void {
        if (typeof cancelAnimationFrame !== "undefined") {
            cancelAnimationFrame(id);
        } else {
            clearTimeout(id);
        }
    }

    public now(): number {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
            return performance.now();
        }
        return Date.now();
    }

    public requestFrame(callback: FrameRequestCallback): number {
        if (typeof requestAnimationFrame !== "undefined") {
            return requestAnimationFrame(() => callback(this.now()));
        }
        return setTimeout(() => callback(this.now()), 16) as unknown as number;
    }
}

export class FakeAnimationClock implements ChartAnimationClock {
    readonly #scheduledCallbacks = new Map<number, FrameRequestCallback>();
    #currentTime: number;
    #nextId = 1;
    public constructor(initialTime = 0) {
        this.#currentTime = initialTime;
    }

    public cancelFrame(id: number): void {
        this.#scheduledCallbacks.delete(id);
    }

    public flush(): void {
        const currentCallbacks = Array.from(this.#scheduledCallbacks.entries());
        this.#scheduledCallbacks.clear();
        for (const [, callback] of currentCallbacks) {
            callback(this.#currentTime);
        }
    }

    public hasPendingFrames(): boolean {
        return this.#scheduledCallbacks.size > 0;
    }

    public now(): number {
        return this.#currentTime;
    }

    public requestFrame(callback: FrameRequestCallback): number {
        const id = this.#nextId++;
        this.#scheduledCallbacks.set(id, callback);
        return id;
    }

    public setTime(newTime: number): void {
        this.#currentTime = newTime;
    }

    public step(deltaTimeMs = 16.666): void {
        this.#currentTime += deltaTimeMs;
        const currentCallbacks = Array.from(this.#scheduledCallbacks.entries());
        this.#scheduledCallbacks.clear();
        for (const [, callback] of currentCallbacks) {
            callback(this.#currentTime);
        }
    }

    public tick(deltaTimeMs = 16.666): void {
        this.step(deltaTimeMs);
    }
}
