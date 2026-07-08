import { TemplateRef, Type, ViewContainerRef } from "@angular/core";
import { NotificationPosition } from "./NotificationPosition";
import { NotificationType } from "./NotificationType";

export interface NotificationOptions {
    /**
     * @description The container to append the notification's container to. Defaults to `document.body` when omitted.
     */
    appendTo?: ViewContainerRef;

    /**
     * @description Whether a close button is rendered on the notification.
     * @default true when `duration` is not set, otherwise `false`
     */
    closable?: boolean;

    /**
     * @description The accessible title/tooltip for the close button.
     * @default "Close"
     */
    closeTitle?: string;

    /**
     * @description The notification's content. Accepts plain text, a `TemplateRef`, or a component `Type` to render.
     */
    content: string | TemplateRef<unknown> | Type<unknown>;

    /**
     * @description The time, in milliseconds, before the notification automatically closes. Omit to keep the notification open until manually closed.
     */
    duration?: number;

    /**
     * @description The notification's height. A number is treated as pixels.
     */
    height?: number | string;

    /**
     * @description A unique identifier for the notification. Reusing an `id` for the same `position` returns the existing notification instead of creating a new one.
     * @default a generated UUID
     */
    id?: string;

    /**
     * @description The screen position the notification is anchored to.
     * @default "topright"
     */
    position?: NotificationPosition;

    /**
     * @description Whether a countdown progress bar is displayed for a timed (`duration`) notification.
     */
    progressBar?: boolean;

    /**
     * @description The notification's title.
     * @default a title derived from `type` (e.g. "Info", "Success", "Warning", "Error")
     */
    title?: string;

    /**
     * @description The notification's semantic type, controlling its icon, color, and accessibility announcement urgency.
     * @default "info"
     */
    type?: NotificationType;

    /**
     * @description The notification's width. A number is treated as pixels.
     */
    width?: number | string;
}
