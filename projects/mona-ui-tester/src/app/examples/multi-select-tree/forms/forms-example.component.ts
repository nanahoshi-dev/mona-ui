import { Component, signal } from "@angular/core";
import { form, FormField, minLength } from "@angular/forms/signals";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { MultiSelectTreeComponent } from "@nanahoshi/mona-ui/multi-select-tree";

interface Region {
    readonly code: string;
    readonly countries?: readonly Region[];
    readonly name: string;
}

interface ShippingModel {
    countries: string[];
}

@Component({
    selector: "app-multi-select-tree-forms-example",
    imports: [FormField, FormFieldComponent, MultiSelectTreeComponent],
    templateUrl: "./forms-example.component.html"
})
export class MultiSelectTreeFormsExampleComponent {
    readonly #model = signal<ShippingModel>({ countries: [] });
    protected readonly regions: readonly Region[] = [
        {
            code: "EU",
            name: "Europe",
            countries: [
                { code: "DE", name: "Germany" },
                { code: "FR", name: "France" },
                { code: "IT", name: "Italy" },
                { code: "PL", name: "Poland" }
            ]
        },
        {
            code: "AS",
            name: "Asia",
            countries: [
                { code: "JP", name: "Japan" },
                { code: "KR", name: "South Korea" },
                { code: "TR", name: "Türkiye" }
            ]
        }
    ];
    protected readonly shipping = form(this.#model, path => {
        minLength(path.countries, 1, { message: "Choose at least one country." });
    });
}
