import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

interface AddressModel {
    city: string | null;
}

@Component({
    selector: "app-auto-complete-forms-example",
    imports: [AutoCompleteComponent, DropdownFilterableDirective, FormField, LabelDirective],
    templateUrl: "./forms-example.component.html"
})
export class AutoCompleteFormsExampleComponent {
    readonly #model = signal<AddressModel>({ city: null });
    protected readonly address = form(this.#model, path => {
        required(path.city);
    });
    protected readonly cities = ["Amsterdam", "Lisbon", "Madrid", "Prague", "Vienna", "Warsaw"];
}
