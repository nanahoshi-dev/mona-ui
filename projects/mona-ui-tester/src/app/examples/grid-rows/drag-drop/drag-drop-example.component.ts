import { Component, computed, signal } from "@angular/core";
import { BreadcrumbComponent, BreadcrumbItemComponent } from "@nanahoshi/mona-ui/breadcrumb";
import {
    type DragInfo,
    DragPreviewTemplateDirective,
    type DropEffect,
    DropTargetDirective,
    type DropTargetEvent
} from "@nanahoshi/mona-ui/drag-drop";
import {
    GridColumnComponent,
    GridComponent,
    GridRowDragDropDirective,
    type GridRowActivateEvent,
    GridSelectableDirective
} from "@nanahoshi/mona-ui/grid";

interface Entry {
    readonly folder: boolean;
    readonly id: number;
    readonly name: string;
    /** The folder the entry is in. Folder names are unique here, to keep the example short. */
    readonly parent: string;
}

@Component({
    selector: "app-grid-rows-drag-drop-example",
    imports: [
        BreadcrumbComponent,
        BreadcrumbItemComponent,
        DragPreviewTemplateDirective,
        DropTargetDirective,
        GridColumnComponent,
        GridComponent,
        GridRowDragDropDirective,
        GridSelectableDirective
    ],
    templateUrl: "./drag-drop-example.component.html"
})
export class GridRowsDragDropExampleComponent {
    protected readonly current = computed(() => this.path()[this.path().length - 1]);
    protected readonly entries = signal<readonly Entry[]>([
        { folder: true, id: 1, name: "Projects", parent: "Home" },
        { folder: true, id: 2, name: "Drafts", parent: "Projects" },
        { folder: true, id: 3, name: "Final", parent: "Projects" },
        { folder: false, id: 4, name: "budget.xlsx", parent: "Projects" },
        { folder: false, id: 5, name: "outline.docx", parent: "Projects" },
        { folder: false, id: 6, name: "cover.png", parent: "Projects" }
    ]);
    protected readonly lastDrop = signal("");
    protected readonly path = signal<readonly string[]>(["Home", "Projects"]);
    protected readonly selectedIds = signal<number[]>([]);
    protected readonly shown = computed(() =>
        this.entries()
            .filter(entry => entry.parent === this.current())
            .map(entry => ({ ...entry, type: entry.folder ? "Folder" : "File" }))
    );

    /** A crumb takes the drop, except the current folder's, where the entries are already. */
    protected readonly crumbEffect = (_drag: DragInfo, folder: string): DropEffect =>
        folder === this.current() ? "none" : "move";

    protected onActivate(event: GridRowActivateEvent<Entry>): void {
        if (event.rowData.folder) {
            this.path.update(path => [...path, event.rowData.name]);
            this.selectedIds.set([]);
        }
    }

    protected onCrumbDrop(event: DropTargetEvent<string>): void {
        this.moveInto(event.drag.data as Entry[], event.target);
    }

    protected onRowDrop(event: DropTargetEvent<Entry>): void {
        this.moveInto(event.drag.data as Entry[], event.target.name);
    }

    protected openCrumb(index: number): void {
        this.path.update(path => path.slice(0, index + 1));
        this.selectedIds.set([]);
    }

    /** Folders take drops, except the ones dragged; a file's row isn't a target. */
    protected readonly rowEffect = (drag: DragInfo, entry: Entry): DropEffect | null => {
        if (!entry.folder) {
            return null;
        }
        return (drag.data as Entry[]).some(dragged => dragged.id === entry.id) ? "none" : "move";
    };

    private moveInto(dragged: readonly Entry[], folder: string): void {
        const ids = new Set(dragged.map(entry => entry.id));
        this.entries.update(entries =>
            entries.map(entry => (ids.has(entry.id) ? { ...entry, parent: folder } : entry))
        );
        this.selectedIds.set([]);
        this.lastDrop.set(`Moved ${dragged.length === 1 ? dragged[0].name : `${dragged.length} items`} to ${folder}.`);
    }
}
