import { ComponentRef } from "@angular/core";
import { Observable } from "rxjs";

export interface NotificationRef {
    /**
     * @description Emits once the notification has finished closing and been removed.
     */
    readonly afterHide: Observable<void>;

    /**
     * @description The dynamically created content component's reference, or `null` when the notification's content is a string or `TemplateRef`, or before the component has been created.
     */
    readonly content: ComponentRef<unknown> | null;

    /**
     * @description Closes the notification.
     */
    hide(): void;
}
