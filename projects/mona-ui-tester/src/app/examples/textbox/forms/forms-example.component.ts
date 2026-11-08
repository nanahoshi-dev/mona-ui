import { Component, signal } from "@angular/core";
import { email, form, FormField, required } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-textbox-forms-example",
    imports: [FormField, LabelComponent, TextBoxComponent],
    templateUrl: "./forms-example.component.html"
})
export class TextboxFormsExampleComponent {
    readonly #model = signal({ email: "", name: "" });
    protected readonly contact = form(this.#model, path => {
        required(path.name, { message: "Enter your name." });
        required(path.email, { message: "Enter your email address." });
        email(path.email, { message: "Enter an email address like name@example.com." });
    });
}
