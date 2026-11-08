import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { EditorComponent } from "@nanahoshi/mona-ui/editor";

@Component({
    selector: "app-editor-forms-example",
    imports: [EditorComponent, FormField],
    templateUrl: "./forms-example.component.html"
})
export class EditorFormsExampleComponent {
    readonly #model = signal({ description: "" });
    protected readonly issue = form(this.#model, path => {
        required(path.description);
    });
}
