import { Component, signal } from "@angular/core";
import { form, FormField, minLength } from "@angular/forms/signals";
import { LabelDirective } from "@nanahoshi/mona-ui/label";
import { MultiSelectComponent } from "@nanahoshi/mona-ui/multi-select";

interface ProfileModel {
    skills: string[];
}

@Component({
    selector: "app-multi-select-forms-example",
    imports: [FormField, LabelDirective, MultiSelectComponent],
    templateUrl: "./forms-example.component.html"
})
export class MultiSelectFormsExampleComponent {
    readonly #model = signal<ProfileModel>({ skills: [] });
    protected readonly profile = form(this.#model, path => {
        minLength(path.skills, 1);
    });
    protected readonly skills = ["Angular", "CSS", "Node.js", "SQL", "TypeScript"];
}
