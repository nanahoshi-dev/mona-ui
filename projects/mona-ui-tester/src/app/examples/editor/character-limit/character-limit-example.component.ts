import { Component, signal } from "@angular/core";
import { form, FormField, submit, validate } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { countEditorText, EditorComponent } from "@nanahoshi/mona-ui/editor";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

const LIMIT = 140;

@Component({
    selector: "app-editor-character-limit-example",
    imports: [ButtonDirective, EditorComponent, FormField, FormFieldComponent],
    templateUrl: "./character-limit-example.component.html"
})
export class EditorCharacterLimitExampleComponent {
    readonly #model = signal({
        post: "<p>The editor now uploads images, counts what you write, and offers mentions.</p>"
    });
    protected readonly limit = LIMIT;
    protected readonly posted = signal(false);
    protected readonly update = form(this.#model, path => {
        // The editor shows the count and lets people type past it; the form keeps a long post from being sent.
        validate(path.post, ({ value }) =>
            countEditorText(value(), "characters") > LIMIT
                ? { kind: "tooLong", message: `Keep the post to ${LIMIT} characters.` }
                : undefined
        );
    });

    protected onSubmit(event: Event): void {
        event.preventDefault();
        void submit(this.update, async () => {
            this.posted.set(true);
        });
    }
}
