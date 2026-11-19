import { Component, signal } from "@angular/core";
import { LucideGripVertical } from "@lucide/angular";
import { SortableDirective, SortableHandleDirective, SortableItemDirective } from "@nanahoshi/mona-ui/sortable";

interface Widget {
    readonly id: string;
    readonly title: string;
    readonly value: string;
}

@Component({
    selector: "app-sortable-tiles-example",
    imports: [LucideGripVertical, SortableDirective, SortableHandleDirective, SortableItemDirective],
    templateUrl: "./tiles-example.component.html"
})
export class SortableTilesExampleComponent {
    protected readonly widgets = signal<Widget[]>([
        { id: "visitors", title: "Visitors", value: "12,480" },
        { id: "signups", title: "Sign-ups", value: "312" },
        { id: "revenue", title: "Revenue", value: "$8,920" },
        { id: "churn", title: "Churn", value: "1.8%" },
        { id: "tickets", title: "Open tickets", value: "27" }
    ]);
}
