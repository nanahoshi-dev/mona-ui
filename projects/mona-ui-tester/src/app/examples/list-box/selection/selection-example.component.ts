import { Component, signal } from "@angular/core";
import { ListBoxComponent } from "@nanahoshi/mona-ui/list-box";

@Component({
    selector: "app-list-box-selection-example",
    imports: [ListBoxComponent],
    templateUrl: "./selection-example.component.html"
})
export class ListBoxSelectionExampleComponent {
    protected readonly fruits = [
        { id: 1, name: "Apple" },
        { id: 2, name: "Banana" },
        { id: 3, name: "Cherry" },
        { id: 4, name: "Grape" },
        { id: 5, name: "Mango" },
        { id: 6, name: "Orange" }
    ];
    protected readonly selectedIds = signal<number[]>([2]);
}
