import type { Observable } from "rxjs";
import type { SpinnerUpdate } from "./SpinnerUpdate";

export interface SpinnerRef {
    /**
     * Emits when the user cancels the loading request. Completes when the request ends, without emitting if it wasn't
     * cancelled.
     */
    readonly cancelled$: Observable<void>;
    /** Idempotently closes the request and releases target leases. */
    close(): void;
    /** Unique request identifier. */
    readonly id: string;
    /** Dynamically updates `text`, `appearance`, or `size`. */
    update(update: SpinnerUpdate): void;
}
