import { ComponentRef } from "@angular/core";
import { Observable } from "rxjs";

export interface NotificationRef {
    readonly afterHide: Observable<void>;
    readonly content: ComponentRef<unknown> | null | undefined;
    hide(): void;
}
