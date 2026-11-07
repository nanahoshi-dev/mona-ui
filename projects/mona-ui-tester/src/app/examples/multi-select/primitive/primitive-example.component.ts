import { Component, signal } from "@angular/core";
import { LabelDirective } from "@nanahoshi/mona-ui/label";
import { MultiSelectComponent } from "@nanahoshi/mona-ui/multi-select";

@Component({
    selector: "app-multi-select-primitive-example",
    imports: [LabelDirective, MultiSelectComponent],
    templateUrl: "./primitive-example.component.html"
})
export class MultiSelectPrimitiveExampleComponent {
    protected readonly dayIds = signal<number[]>([1, 3]);
    protected readonly days = [
        { id: 1, name: "Monday" },
        { id: 2, name: "Tuesday" },
        { id: 3, name: "Wednesday" },
        { id: 4, name: "Thursday" },
        { id: 5, name: "Friday" }
    ];
}
