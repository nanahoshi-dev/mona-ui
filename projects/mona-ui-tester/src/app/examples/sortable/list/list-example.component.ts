import { Component, signal } from "@angular/core";
import { SortableDirective, SortableItemDirective } from "@nanahoshi/mona-ui/sortable";

@Component({
    selector: "app-sortable-list-example",
    imports: [SortableDirective, SortableItemDirective],
    templateUrl: "./list-example.component.html"
})
export class SortableListExampleComponent {
    protected readonly priorities = signal([
        "Fix the sign-in bug",
        "Write the release notes",
        "Review the onboarding design",
        "Plan the team offsite"
    ]);
}
