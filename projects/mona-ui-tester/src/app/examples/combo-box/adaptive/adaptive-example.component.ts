import { Component, signal } from "@angular/core";
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

@Component({
    selector: "app-combo-box-adaptive-example",
    imports: [ComboBoxComponent, DropdownFilterableDirective, FormFieldComponent],
    templateUrl: "./adaptive-example.component.html"
})
export class ComboBoxAdaptiveExampleComponent {
    protected readonly countries = [
        "Argentina",
        "Australia",
        "Brazil",
        "Canada",
        "Germany",
        "Indonesia",
        "Italy",
        "Japan",
        "Poland",
        "South Korea",
        "Spain",
        "Türkiye"
    ];
    protected readonly country = signal<string | null>("Japan");
}
