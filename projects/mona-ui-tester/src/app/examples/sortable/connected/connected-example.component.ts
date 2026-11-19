import { Component, signal } from "@angular/core";
import { SortableDirective, SortableGroupDirective, SortableItemDirective } from "@nanahoshi/mona-ui/sortable";

/** The most columns the table shows. */
const MAX_SHOWN = 5;

@Component({
    selector: "app-sortable-connected-example",
    imports: [SortableDirective, SortableGroupDirective, SortableItemDirective],
    templateUrl: "./connected-example.component.html"
})
export class SortableConnectedExampleComponent {
    protected readonly hidden = signal(["Email", "Phone", "Country", "Start date"]);
    protected readonly maxShown = MAX_SHOWN;
    protected readonly shown = signal(["Name", "Role", "Team"]);

    /** A column can join the shown ones while there's room; the shown ones can always be reordered. */
    protected readonly canShow = (): boolean => this.shown().length < MAX_SHOWN;
}
