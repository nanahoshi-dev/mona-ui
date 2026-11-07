import { Component, signal } from "@angular/core";
import { ListViewComponent, ListViewSelectableDirective } from "@nanahoshi/mona-ui/list-view";

@Component({
    selector: "app-list-view-selection-example",
    imports: [ListViewComponent, ListViewSelectableDirective],
    templateUrl: "./selection-example.component.html"
})
export class ListViewSelectionExampleComponent {
    protected readonly channels = [
        { id: 1, name: "Email" },
        { id: 2, name: "Push notifications" },
        { id: 3, name: "SMS" },
        { id: 4, name: "Slack" },
        { id: 5, name: "Weekly digest" }
    ];
    protected readonly selectedIds = signal<number[]>([1]);
}
