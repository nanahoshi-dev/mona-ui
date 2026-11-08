import { Component, signal } from "@angular/core";
import { form, FormField, maxLength, required } from "@angular/forms/signals";
import { TextAreaDirective } from "@nanahoshi/mona-ui/text-area";

@Component({
    selector: "app-textarea-forms-example",
    imports: [FormField, TextAreaDirective],
    templateUrl: "./forms-example.component.html"
})
export class TextareaFormsExampleComponent {
    readonly #model = signal({ feedback: "" });
    protected readonly maxFeedbackLength = 140;
    protected readonly review = form(this.#model, path => {
        required(path.feedback, { message: "Tell us what you think." });
        maxLength(path.feedback, this.maxFeedbackLength, {
            message: `Keep it to ${this.maxFeedbackLength} characters.`
        });
    });
}
