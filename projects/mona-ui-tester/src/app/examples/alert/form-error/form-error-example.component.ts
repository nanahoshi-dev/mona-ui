import { Component, type ElementRef, signal, viewChild } from "@angular/core";
import { AlertActionsDirective, AlertComponent } from "@nanahoshi/mona-ui/alert";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-alert-form-error-example",
    imports: [AlertActionsDirective, AlertComponent, ButtonDirective, TextBoxDirective],
    templateUrl: "./form-error-example.component.html"
})
export class AlertFormErrorExampleComponent {
    protected readonly failed = signal(false);
    protected readonly saveButton = viewChild.required<ElementRef<HTMLButtonElement>>("saveButton");
    protected readonly saving = signal(false);

    protected dismiss(): void {
        this.failed.set(false);
        // The dismiss button goes with the alert, so focus moves to where the user carries on.
        this.saveButton().nativeElement.focus();
    }

    protected retry(): void {
        // The alert, and the button that was pressed, go away while it saves again.
        this.saveButton().nativeElement.focus();
        this.save();
    }

    protected submit(event: Event): void {
        event.preventDefault();
        this.save();
    }

    private save(): void {
        this.failed.set(false);
        this.saving.set(true);
        // Stands in for a request that fails.
        setTimeout(() => {
            this.saving.set(false);
            this.failed.set(true);
        }, 800);
    }
}
