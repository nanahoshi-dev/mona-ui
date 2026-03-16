import { ComponentRef, ViewContainerRef } from "@angular/core";
import { NotificationContainerComponent } from "../components/notification-container/notification-container.component";
import { NotificationData } from "./NotificationData";
import { Subscription } from "rxjs";

export interface NotificationContainerData {
    appendTo?: ViewContainerRef;
    componentRef: ComponentRef<NotificationContainerComponent> | null;
    notifications: Map<string, NotificationData>;
    subscription?: Subscription;
}
