import { Component, signal } from "@angular/core";
import { form, FormField, pattern, required } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";

@Component({
    selector: "app-otp-input-forms-example",
    imports: [FormField, LabelComponent, OtpInputComponent],
    templateUrl: "./forms-example.component.html"
})
export class OtpInputFormsExampleComponent {
    readonly #model = signal({ code: "" });
    protected readonly login = form(this.#model, path => {
        required(path.code);
        pattern(path.code, /^\d{6}$/);
    });
}
