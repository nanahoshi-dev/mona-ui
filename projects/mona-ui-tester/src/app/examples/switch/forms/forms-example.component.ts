import { Component, signal } from "@angular/core";
import { disabled, form, FormField } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";

@Component({
    selector: "app-switch-forms-example",
    imports: [FormField, LabelComponent, SwitchComponent],
    templateUrl: "./forms-example.component.html"
})
export class SwitchFormsExampleComponent {
    readonly #model = signal({ digest: false, emails: true });
    protected readonly settings = form(this.#model, path => {
        disabled(path.digest, ({ valueOf }) => !valueOf(path.emails));
    });
}
