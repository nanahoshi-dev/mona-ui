import { Component, signal } from "@angular/core";
import { form, FormField, pattern, required } from "@angular/forms/signals";
import { LucideCircleAlert } from "@lucide/angular";
import { FormFieldComponent, FormFieldErrorTemplateDirective } from "@nanahoshi/mona-ui/form-field";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-form-field-custom-errors-example",
    imports: [FormField, FormFieldComponent, FormFieldErrorTemplateDirective, LucideCircleAlert, TextBoxComponent],
    templateUrl: "./custom-errors-example.component.html"
})
export class FormFieldCustomErrorsExampleComponent {
    readonly #model = signal({ postcode: "" });
    protected readonly address = form(this.#model, path => {
        required(path.postcode, { message: "Enter your postcode." });
        pattern(path.postcode, /^\d{2}-\d{3}$/, { message: "Enter a postcode like 00-950." });
    });

    protected touch(): void {
        this.address.postcode().markAsTouched();
    }
}
