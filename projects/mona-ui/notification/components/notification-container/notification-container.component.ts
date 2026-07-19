import { Component, computed, inject, signal } from "@angular/core";
import { NotificationData } from "../../models/NotificationData";
import { NotificationPosition } from "../../models/NotificationPosition";
import { notificationContainerBaseThemeVariants } from "../../styles/notification.styles";
import { NotificationComponent } from "../notification/notification.component";

@Component({
    selector: "mona-notification-container",
    templateUrl: "./notification-container.component.html",
    imports: [NotificationComponent],
    host: {
        "[class]": "baseClass()"
    }
})
export class NotificationContainerComponent {
    protected readonly baseClass = computed(() => {
        const position = this.position();
        const positionType = this.positionType();
        return notificationContainerBaseThemeVariants({ position, positionType });
    });
    protected readonly enterAnimClass = computed(() =>
        this.position().startsWith("bottom") ? "notification-enter-bottom" : "notification-enter-top"
    );
    protected readonly leaveAnimClass = computed(() =>
        this.position().startsWith("bottom") ? "notification-leave-bottom" : "notification-leave-top"
    );
    public readonly notificationDataList = signal<NotificationData[]>([]);
    public readonly position = signal<NotificationPosition>("topright");
    public readonly positionType = signal<"fixed" | "absolute">("fixed");
}
