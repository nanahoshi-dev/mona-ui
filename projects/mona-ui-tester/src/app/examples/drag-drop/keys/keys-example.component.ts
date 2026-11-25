import { Component, computed, signal } from "@angular/core";
import { LucideFolder } from "@lucide/angular";
import {
    type DragInfo,
    DragPreviewTemplateDirective,
    DraggableDirective,
    type DropEffect,
    DropTargetDirective,
    type DropTargetEvent
} from "@nanahoshi/mona-ui/drag-drop";

interface FileItem {
    readonly folder: string;
    readonly name: string;
}

@Component({
    selector: "app-drag-drop-keys-example",
    imports: [DragPreviewTemplateDirective, DraggableDirective, DropTargetDirective, LucideFolder],
    templateUrl: "./keys-example.component.html"
})
export class DragDropKeysExampleComponent {
    /** How many files each folder holds, as its card says it. */
    protected readonly counts = computed(() =>
        Object.fromEntries(
            this.folders.map(folder => {
                const count = this.files().filter(file => file.folder === folder).length;
                return [folder, count === 1 ? "1 file" : `${count} files`];
            })
        )
    );
    protected readonly files = signal<readonly FileItem[]>([
        { folder: "Documents", name: "budget.xlsx" },
        { folder: "Documents", name: "letter.docx" },
        { folder: "Pictures", name: "beach.jpg" }
    ]);
    protected readonly folders = ["Documents", "Pictures", "Archive"];
    protected readonly lastDrop = signal("");

    /**
     * As in a file explorer: Ctrl copies, and otherwise the file moves, though not into the folder it's in. The
     * function runs again as keys are pressed during the drag.
     */
    protected readonly effectFor = (drag: DragInfo<FileItem>, folder: string): DropEffect => {
        if (drag.ctrlKey) {
            return "copy";
        }
        return drag.data.folder === folder ? "none" : "move";
    };

    protected onDrop(event: DropTargetEvent<string, FileItem>): void {
        const file = event.drag.data;
        if (event.effect === "copy") {
            const copy = { folder: event.target, name: file.name.replace(/(\.\w+)?$/, " - Copy$1") };
            this.files.update(files => [...files, copy]);
            this.lastDrop.set(`Copied ${file.name} to ${event.target}.`);
        } else {
            this.files.update(files =>
                files.map(other => (other === file ? { ...file, folder: event.target } : other))
            );
            this.lastDrop.set(`Moved ${file.name} to ${event.target}.`);
        }
    }
}
