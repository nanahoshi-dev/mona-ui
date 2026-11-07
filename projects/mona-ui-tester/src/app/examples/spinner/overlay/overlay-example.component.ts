import { Component, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SpinnerService } from "@nanahoshi/mona-ui/spinner";

@Component({
    selector: "app-spinner-overlay-example",
    imports: [ButtonDirective],
    templateUrl: "./overlay-example.component.html"
})
export class SpinnerOverlayExampleComponent {
    readonly #spinnerService = inject(SpinnerService);
    protected readonly saving = signal(false);

    protected save(panel: HTMLElement): void {
        this.saving.set(true);
        const spinner = this.#spinnerService.show({ target: panel, text: "Saving changes…" });
        // Stands in for a request to a server.
        setTimeout(() => {
            spinner.close();
            this.saving.set(false);
        }, 2000);
    }
}
