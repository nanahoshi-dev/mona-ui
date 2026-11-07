import type { TemplateRef } from "@angular/core";
import { Component, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { NotificationService } from "@nanahoshi/mona-ui/notification";

@Component({
    selector: "app-notification-template-example",
    imports: [ButtonDirective],
    templateUrl: "./template-example.component.html"
})
export class NotificationTemplateExampleComponent {
    readonly #notificationService = inject(NotificationService);
    protected readonly files = signal(["budget.xlsx", "report.pdf", "roadmap.docx"]);

    protected moveToBin(file: string, undoTemplate: TemplateRef<unknown>): void {
        this.files.update(files => files.filter(item => item !== file));
        this.#notificationService.show({ content: undoTemplate, data: { file }, duration: 8000 });
    }

    protected undo(file: string): void {
        this.files.update(files => [...files, file].sort());
    }
}
