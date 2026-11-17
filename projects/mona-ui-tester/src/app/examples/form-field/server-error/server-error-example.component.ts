import { Component, computed, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

const TAKEN = ["admin", "mona", "root"];

@Component({
    selector: "app-form-field-server-error-example",
    imports: [ButtonDirective, FormFieldComponent, TextBoxComponent],
    templateUrl: "./server-error-example.component.html"
})
export class FormFieldServerErrorExampleComponent {
    protected readonly checked = signal<string | null>(null);
    protected readonly error = computed(() => {
        const checked = this.checked();
        return checked !== null && TAKEN.includes(checked.toLowerCase()) ? `"${checked}" is already taken.` : "";
    });
    protected readonly username = signal("mona");

    protected check(): void {
        this.checked.set(this.username());
    }
}
