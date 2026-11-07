import { Component, signal } from "@angular/core";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";
import { MultiSelectComponent } from "@nanahoshi/mona-ui/multi-select";

@Component({
    selector: "app-multi-select-checkboxes-example",
    imports: [DropdownFilterableDirective, LabelDirective, MultiSelectComponent],
    templateUrl: "./checkboxes-example.component.html"
})
export class MultiSelectCheckboxesExampleComponent {
    protected readonly chosen = signal<string[]>(["Basil"]);
    protected readonly toppings = ["Basil", "Mushrooms", "Olives", "Onions", "Peppers", "Pineapple", "Spinach"];
}
