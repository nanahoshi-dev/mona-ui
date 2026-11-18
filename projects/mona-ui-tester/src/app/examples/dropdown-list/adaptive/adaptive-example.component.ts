import { Component, signal } from "@angular/core";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

@Component({
    selector: "app-dropdown-list-adaptive-example",
    imports: [DropdownFilterableDirective, DropdownListComponent, FormFieldComponent],
    templateUrl: "./adaptive-example.component.html"
})
export class DropdownListAdaptiveExampleComponent {
    protected readonly timeZone = signal<string | null>("Europe/Istanbul");
    protected readonly timeZones = [
        "America/New_York",
        "America/Sao_Paulo",
        "Asia/Seoul",
        "Asia/Tokyo",
        "Australia/Sydney",
        "Europe/Berlin",
        "Europe/Istanbul",
        "Europe/London",
        "Europe/Warsaw"
    ];
}
