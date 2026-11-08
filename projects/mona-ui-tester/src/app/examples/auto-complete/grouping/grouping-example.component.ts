import { Component, signal } from "@angular/core";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import { DropdownFilterableDirective, DropdownGroupableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

@Component({
    selector: "app-auto-complete-grouping-example",
    imports: [AutoCompleteComponent, DropdownFilterableDirective, DropdownGroupableDirective, LabelDirective],
    templateUrl: "./grouping-example.component.html"
})
export class AutoCompleteGroupingExampleComponent {
    protected readonly cities = [
        { name: "Hamburg", country: "Germany" },
        { name: "Munich", country: "Germany" },
        { name: "Osaka", country: "Japan" },
        { name: "Tokyo", country: "Japan" },
        { name: "Bergen", country: "Norway" },
        { name: "Oslo", country: "Norway" }
    ];
    protected readonly city = signal<string | null>(null);
}
