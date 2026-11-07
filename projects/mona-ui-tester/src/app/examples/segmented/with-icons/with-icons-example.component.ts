import { Component, signal } from "@angular/core";
import { LucideLayoutGrid, LucideList } from "@lucide/angular";
import { SegmentedComponent, SegmentedItemTemplateDirective, type SegmentedOption } from "@nanahoshi/mona-ui/segmented";

type ViewMode = "grid" | "list";

@Component({
    selector: "app-segmented-with-icons-example",
    imports: [LucideLayoutGrid, LucideList, SegmentedComponent, SegmentedItemTemplateDirective],
    templateUrl: "./with-icons-example.component.html"
})
export class SegmentedWithIconsExampleComponent {
    protected readonly viewMode = signal<ViewMode | null>("list");
    protected readonly viewModes: readonly SegmentedOption<ViewMode>[] = [
        { label: "List", value: "list" },
        { label: "Grid", value: "grid" }
    ];
}
