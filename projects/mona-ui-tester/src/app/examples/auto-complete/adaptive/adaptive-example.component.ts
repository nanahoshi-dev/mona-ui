import { Component, signal } from "@angular/core";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

@Component({
    selector: "app-auto-complete-adaptive-example",
    imports: [AutoCompleteComponent, DropdownFilterableDirective, FormFieldComponent],
    templateUrl: "./adaptive-example.component.html"
})
export class AutoCompleteAdaptiveExampleComponent {
    protected readonly cities = [
        "Amsterdam",
        "Barcelona",
        "Berlin",
        "Istanbul",
        "Kraków",
        "Lisbon",
        "Osaka",
        "Seoul",
        "Sydney",
        "Toronto",
        "Vienna"
    ];
    protected readonly city = signal<string | null>(null);
}
