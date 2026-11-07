import { Component, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { NotificationService, type NotificationType } from "@nanahoshi/mona-ui/notification";

@Component({
    selector: "app-notification-types-example",
    imports: [ButtonDirective],
    templateUrl: "./types-example.component.html"
})
export class NotificationTypesExampleComponent {
    readonly #notificationService = inject(NotificationService);
    protected readonly messages: Record<NotificationType, string> = {
        error: "The file couldn't be uploaded.",
        info: "A new version is available.",
        success: "Your changes have been saved.",
        warning: "Your session ends in 5 minutes."
    };

    protected notify(type: NotificationType): void {
        this.#notificationService.show({ content: this.messages[type], duration: 5000, progressBar: true, type });
    }
}
