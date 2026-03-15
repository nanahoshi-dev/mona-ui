import { TemplateRef, Type } from "@angular/core";
import { NotificationPosition } from "./NotificationPosition";
import { NotificationType } from "./NotificationType";

export interface NotificationOptions {
    closable?: boolean;
    closeTitle?: string;
    content: string | TemplateRef<unknown> | Type<unknown>;
    duration?: number;
    height?: number | string;
    id?: string;
    position?: NotificationPosition;
    progressBar?: boolean;
    title?: string;
    type?: NotificationType;
    width?: number | string;
}
