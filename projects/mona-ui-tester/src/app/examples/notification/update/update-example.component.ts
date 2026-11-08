import { Component, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { NotificationService } from "@nanahoshi/mona-ui/notification";

@Component({
    selector: "app-notification-update-example",
    imports: [ButtonDirective],
    templateUrl: "./update-example.component.html"
})
export class NotificationUpdateExampleComponent {
    readonly #notificationService = inject(NotificationService);

    protected upload(): void {
        const ref = this.#notificationService.show({
            closable: false,
            content: "Uploading report.pdf…",
            title: "Uploading"
        });
        // Stands in for an upload to a server.
        setTimeout(() => {
            ref.update({ closable: true, content: "report.pdf was uploaded.", title: "Done", type: "success" });
        }, 2500);
    }
}
