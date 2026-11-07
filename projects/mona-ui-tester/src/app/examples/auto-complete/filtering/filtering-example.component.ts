import { Component, signal } from "@angular/core";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

@Component({
    selector: "app-auto-complete-filtering-example",
    imports: [AutoCompleteComponent, DropdownFilterableDirective, LabelDirective],
    templateUrl: "./filtering-example.component.html"
})
export class AutoCompleteFilteringExampleComponent {
    protected readonly countries = ["Argentina", "Canada", "Chile", "Germany", "Japan", "Kenya", "Mexico", "Norway"];
    protected readonly country = signal<string | null>(null);
}
