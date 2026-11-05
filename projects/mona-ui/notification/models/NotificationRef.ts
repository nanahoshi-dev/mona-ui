import type { ComponentRef } from "@angular/core";
import type { Observable } from "rxjs";
import type { NotificationOptions } from "./NotificationOptions";

/**
 * @description The options `NotificationRef.update()` can change on a notification that is already shown.
 */
export type NotificationUpdate = Partial<Pick<NotificationOptions, "closable" | "content" | "title" | "type">>;

export interface NotificationRef {
    /**
     * @description Emits once the notification has finished closing, after its leave animation, and been removed.
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

    /**
     * @description The notification's id: the one given in its options, or a generated one.
     */
    readonly id: string;

    /**
     * @description Changes the content, title, type or close button of the notification. The new message is
     * announced to assistive technology.
     */
    update(changes: NotificationUpdate): void;
}
