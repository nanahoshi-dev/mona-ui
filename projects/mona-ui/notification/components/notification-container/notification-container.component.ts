import { Component, computed, inject, signal } from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { NOTIFICATION_DEFAULT_MESSAGES } from "../../i18n/notification.default-messages";
import type { NotificationData } from "../../models/NotificationData";
import type { NotificationPosition } from "../../models/NotificationPosition";
import { notificationContainerBaseThemeVariants } from "../../styles/notification.styles";
import { NotificationComponent } from "../notification/notification.component";

@Component({
    selector: "mona-notification-container",
    templateUrl: "./notification-container.component.html",
    imports: [NotificationComponent],
    host: {
        "[attr.aria-label]": "messages().region",
        "[class]": "baseClass()",
        role: "region"
    }
})
export class NotificationContainerComponent {
    readonly #i18n = inject(MonaI18nService);
    protected readonly baseClass = computed(() => {
        const position = this.position();
        const positionType = this.positionType();
        return notificationContainerBaseThemeVariants({ position, positionType });
    });
    protected readonly enterAnimClass = computed(() =>
        this.side() === "bottom" ? "notification-enter-bottom" : "notification-enter-top"
    );
    protected readonly messages = this.#i18n.componentMessages("notification", NOTIFICATION_DEFAULT_MESSAGES);
    protected readonly side = computed(() => (this.position().startsWith("bottom") ? "bottom" : "top"));
    public readonly notificationDataList = signal<NotificationData[]>([]);
    public readonly position = signal<NotificationPosition>("topright");
    public readonly positionType = signal<"fixed" | "absolute">("fixed");
}
