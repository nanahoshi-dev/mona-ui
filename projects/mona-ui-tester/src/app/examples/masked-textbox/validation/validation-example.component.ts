import { Component, signal } from "@angular/core";
import { form, FormField, required, submit, validate } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { isMaskComplete, MaskedTextBoxComponent } from "@nanahoshi/mona-ui/masked-text-box";

const EXPIRY_MASK = "00/00";

@Component({
    selector: "app-masked-textbox-validation-example",
    imports: [ButtonDirective, FormField, FormFieldComponent, MaskedTextBoxComponent],
    templateUrl: "./validation-example.component.html"
})
export class MaskedTextboxValidationExampleComponent {
    readonly #model = signal({ expiry: "" });
    protected readonly card = form(this.#model, path => {
        required(path.expiry, { message: "Enter the expiry date." });
        validate(path.expiry, ({ value }) => {
            const expiry = value();
            // An empty field is left to required, which has its own message.
            if (expiry === "") {
                return undefined;
            }
            if (!isMaskComplete(expiry, EXPIRY_MASK)) {
                return { kind: "incomplete", message: "Enter the month and the year, such as 08/29." };
            }
            const month = Number(expiry.slice(0, 2));
            return month >= 1 && month <= 12 ? undefined : { kind: "month", message: "Enter a month from 01 to 12." };
        });
    });
    protected readonly mask = EXPIRY_MASK;
    protected readonly saved = signal(false);

    protected onSubmit(event: Event): void {
        event.preventDefault();
        void submit(this.card, async () => {
            this.saved.set(true);
        });
    }
}
