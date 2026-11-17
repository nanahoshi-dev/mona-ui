import { Component, signal } from "@angular/core";
import { email, form, FormField, minLength, required, submit } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

interface AccountModel {
    email: string;
    name: string;
    password: string;
}

@Component({
    selector: "app-form-field-signal-forms-example",
    imports: [ButtonDirective, FormField, FormFieldComponent, TextBoxComponent],
    templateUrl: "./signal-forms-example.component.html"
})
export class FormFieldSignalFormsExampleComponent {
    readonly #model = signal<AccountModel>({ email: "", name: "", password: "" });
    protected readonly account = form(this.#model, path => {
        required(path.name);
        required(path.email);
        email(path.email);
        required(path.password);
        minLength(path.password, 12);
    });
    protected readonly created = signal(false);

    protected onSubmit(event: Event): void {
        event.preventDefault();
        void submit(this.account, async () => {
            this.created.set(true);
        });
    }
}
