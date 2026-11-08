import { Component, signal } from "@angular/core";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

@Component({
    selector: "app-dropdown-list-primitive-example",
    imports: [DropdownListComponent, LabelDirective],
    templateUrl: "./primitive-example.component.html"
})
export class DropdownListPrimitiveExampleComponent {
    protected readonly priorities = [
        { id: 1, label: "Low" },
        { id: 2, label: "Normal" },
        { id: 3, label: "High" },
        { id: 4, label: "Urgent" }
    ];
    protected readonly priorityId = signal<number | null>(2);
}
