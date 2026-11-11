import { Component, signal } from "@angular/core";
import {
    GridColumnComponent,
    GridComponent,
    GridDetailTemplateDirective,
    GridRowReorderableDirective,
    type RowReorderEvent
} from "@nanahoshi/mona-ui/grid";

type Task = Record<PropertyKey, unknown> & {
    id: number;
    notes: string;
    owner: string;
    title: string;
};

@Component({
    selector: "app-grid-rows-master-detail-example",
    imports: [GridColumnComponent, GridComponent, GridDetailTemplateDirective, GridRowReorderableDirective],
    templateUrl: "./master-detail-example.component.html"
})
export class GridMasterDetailExampleComponent {
    protected readonly expandedKeys = signal<unknown[]>([2]);
    protected readonly tasks = signal<Task[]>([
        { id: 1, title: "Draft the release notes", owner: "Amara Okafor", notes: "Cover the new grid pages." },
        { id: 2, title: "Review the migration guide", owner: "Lukas Weber", notes: "Check every renamed input." },
        { id: 3, title: "Record the demo video", owner: "Mei Tanaka", notes: "Two minutes, captions on." },
        { id: 4, title: "Publish the package", owner: "Diego Ramos", notes: "After the release notes are in." }
    ]);

    protected onRowReorder(event: RowReorderEvent): void {
        // The grid never changes the data: set the new order to keep it.
        this.tasks.set([...event.reorderedData] as Task[]);
    }
}
