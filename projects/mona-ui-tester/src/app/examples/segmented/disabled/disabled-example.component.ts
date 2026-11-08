import { Component, signal } from "@angular/core";
import { SegmentedComponent, type SegmentedOption } from "@nanahoshi/mona-ui/segmented";

type SortOrder = "archived" | "newest" | "popular";

@Component({
    selector: "app-segmented-disabled-example",
    imports: [SegmentedComponent],
    templateUrl: "./disabled-example.component.html"
})
export class SegmentedDisabledExampleComponent {
    protected readonly sort = signal<SortOrder | null>("newest");
    protected readonly sortOptions: readonly SegmentedOption<SortOrder>[] = [
        { label: "Newest", value: "newest" },
        { label: "Popular", value: "popular" },
        { label: "Archived", value: "archived", disabled: true }
    ];
}
