import { Component, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { DialogService } from "@nanahoshi/mona-ui/dialog";

@Component({
    selector: "app-dialog-service-example",
    imports: [ButtonDirective],
    templateUrl: "./service-example.component.html"
})
export class DialogServiceExampleComponent {
    readonly #dialogService = inject(DialogService);
    protected readonly status = signal("Active");

    protected archive(): void {
        this.#dialogService
            .confirm({
                text: "Archived projects are read-only until you restore them.",
                title: "Archive this project?"
            })
            .subscribe(confirmed => {
                if (confirmed) {
                    this.status.set("Archived");
                }
            });
    }
}
