import type { Observable } from "rxjs";
import type { SpinnerUpdate } from "./SpinnerUpdate";

export interface SpinnerRef {
    readonly cancelled$: Observable<void>;
    readonly id: string;
    close(): void;
    update(update: SpinnerUpdate): void;
}
