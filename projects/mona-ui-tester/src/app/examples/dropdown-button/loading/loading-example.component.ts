import { Component, signal } from "@angular/core";
import { DropdownButtonComponent, DropdownButtonItemComponent } from "@nanahoshi/mona-ui/dropdown-button";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";

@Component({
    selector: "app-dropdown-button-loading-example",
    imports: [DropdownButtonComponent, DropdownButtonItemComponent],
    templateUrl: "./loading-example.component.html"
})
export class DropdownButtonLoadingExampleComponent {
    protected readonly exporting = signal(false);
    protected readonly status = signal("Nothing exported yet");

    protected export(event: PopupMenuItemClickEvent): void {
        this.exporting.set(true);
        this.status.set(`Exporting as ${event.label}…`);
        // Stands in for a request to the server.
        setTimeout(() => {
            this.exporting.set(false);
            this.status.set(`Exported as ${event.label}`);
        }, 1500);
    }
}
