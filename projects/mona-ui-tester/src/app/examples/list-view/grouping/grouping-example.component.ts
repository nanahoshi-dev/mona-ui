import { Component } from "@angular/core";
import {
    ListViewComponent,
    ListViewGroupableDirective,
    ListViewGroupHeaderTemplateDirective
} from "@nanahoshi/mona-ui/list-view";

@Component({
    selector: "app-list-view-grouping-example",
    imports: [ListViewComponent, ListViewGroupableDirective, ListViewGroupHeaderTemplateDirective],
    templateUrl: "./grouping-example.component.html"
})
export class ListViewGroupingExampleComponent {
    protected readonly groceries = [
        { name: "Spinach", aisle: "Produce" },
        { name: "Apples", aisle: "Produce" },
        { name: "Carrots", aisle: "Produce" },
        { name: "Milk", aisle: "Dairy" },
        { name: "Butter", aisle: "Dairy" },
        { name: "Rice", aisle: "Pantry" },
        { name: "Lentils", aisle: "Pantry" }
    ];
}
