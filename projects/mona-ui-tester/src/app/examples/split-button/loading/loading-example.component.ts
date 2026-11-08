import { Component, signal } from "@angular/core";
import { SplitButtonComponent, SplitButtonItemComponent } from "@nanahoshi/mona-ui/split-button";

@Component({
    selector: "app-split-button-loading-example",
    imports: [SplitButtonComponent, SplitButtonItemComponent],
    templateUrl: "./loading-example.component.html"
})
export class SplitButtonLoadingExampleComponent {
    protected readonly saving = signal(false);
    protected readonly status = signal("Unsaved changes");

    protected save(): void {
        this.saving.set(true);
        this.status.set("Saving…");
        // Stands in for a request to the server.
        setTimeout(() => {
            this.saving.set(false);
            this.status.set("All changes saved");
        }, 1500);
    }
}
