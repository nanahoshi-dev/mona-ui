import type { Observable } from "rxjs";
import type { SpinnerUpdate } from "./SpinnerUpdate";

export interface SpinnerRef {
    readonly cancelled$: Observable<void>;
    close(): void;
    readonly id: string;
    update(update: SpinnerUpdate): void;
}
