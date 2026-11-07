import { Component, signal } from "@angular/core";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownFilterableDirective, DropdownGroupableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

interface TimeZone {
    name: string;
    region: string;
}

@Component({
    selector: "app-dropdown-list-filtering-example",
    imports: [DropdownFilterableDirective, DropdownGroupableDirective, DropdownListComponent, LabelDirective],
    templateUrl: "./filtering-example.component.html"
})
export class DropdownListFilteringExampleComponent {
    protected readonly timeZone = signal<TimeZone | null>(null);
    protected readonly timeZones: TimeZone[] = [
        { name: "Berlin", region: "Europe" },
        { name: "Lisbon", region: "Europe" },
        { name: "London", region: "Europe" },
        { name: "Chicago", region: "Americas" },
        { name: "New York", region: "Americas" },
        { name: "São Paulo", region: "Americas" },
        { name: "Seoul", region: "Asia" },
        { name: "Singapore", region: "Asia" },
        { name: "Tokyo", region: "Asia" }
    ];
}
