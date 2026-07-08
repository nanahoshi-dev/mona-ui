import { ComponentRef, WritableSignal } from "@angular/core";
import { Subject } from "rxjs";
import { NotificationOptions } from "./NotificationOptions";

export interface NotificationData {
    readonly afterHide$: Subject<void>;
    readonly componentDestroy$: Subject<string>;
    readonly contentComponentRef: WritableSignal<ComponentRef<unknown> | null>;
    readonly options: NotificationOptions;
}
