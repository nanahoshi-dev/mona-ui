import { Component, computed, signal } from "@angular/core";
import {
    ContextMenuComponent,
    ContextMenuItemComponent,
    ContextMenuSeparatorComponent
} from "@nanahoshi/mona-ui/contextmenu";
import { GridColumnComponent, GridComponent, GridSelectableDirective } from "@nanahoshi/mona-ui/grid";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";

interface FileEntry {
    readonly id: number;
    readonly modified: string;
    readonly name: string;
    readonly size: string;
}

@Component({
    selector: "app-grid-selection-file-list-example",
    imports: [
        ContextMenuComponent,
        ContextMenuItemComponent,
        ContextMenuSeparatorComponent,
        GridColumnComponent,
        GridComponent,
        GridSelectableDirective
    ],
    templateUrl: "./file-list-example.component.html"
})
export class GridFileListExampleComponent {
    protected readonly files: readonly FileEntry[] = [
        { id: 1, name: "Budget 2026.xlsx", modified: "2026-03-02", size: "48 KB" },
        { id: 2, name: "Holiday photos", modified: "2026-02-14", size: "" },
        { id: 3, name: "Invoice 1042.pdf", modified: "2026-01-30", size: "212 KB" },
        { id: 4, name: "Meeting notes.txt", modified: "2026-03-11", size: "3 KB" },
        { id: 5, name: "Presentation.pptx", modified: "2026-02-27", size: "5.1 MB" },
        { id: 6, name: "Recipes", modified: "2025-12-08", size: "" }
    ];
    protected readonly lastCommand = signal("");
    protected readonly selectedCount = computed(() => this.selectedIds().length);
    protected readonly selectedIds = signal<number[]>([]);

    protected onMenuClick(event: PopupMenuItemClickEvent): void {
        const names = this.files.filter(file => this.selectedIds().includes(file.id)).map(file => file.name);
        this.lastCommand.set(names.length === 0 ? event.label : `${event.label}: ${names.join(", ")}`);
    }
}
