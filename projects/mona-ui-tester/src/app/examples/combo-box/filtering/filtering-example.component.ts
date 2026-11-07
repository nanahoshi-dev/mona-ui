import { Component, signal } from "@angular/core";
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

interface Country {
    id: number;
    name: string;
}

@Component({
    selector: "app-combo-box-filtering-example",
    imports: [ComboBoxComponent, DropdownFilterableDirective, LabelDirective],
    templateUrl: "./filtering-example.component.html"
})
export class ComboBoxFilteringExampleComponent {
    protected readonly countries: Country[] = [
        { id: 1, name: "Argentina" },
        { id: 2, name: "Canada" },
        { id: 3, name: "Germany" },
        { id: 4, name: "Japan" },
        { id: 5, name: "Kenya" },
        { id: 6, name: "Mexico" },
        { id: 7, name: "Norway" }
    ];
    protected readonly country = signal<Country | null>(null);
}
