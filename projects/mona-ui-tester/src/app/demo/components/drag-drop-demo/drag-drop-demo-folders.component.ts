import { booleanAttribute, Component, input, signal } from "@angular/core";
import { LucideFolder } from "@lucide/angular";
import {
    DraggableDirective,
    type DropEffect,
    DropTargetDirective,
    type DropTargetEvent
} from "@nanahoshi/mona-ui/drag-drop";

interface Folder {
    readonly files: readonly string[];
    readonly name: string;
}

interface DraggedFile {
    readonly file: string;
    readonly from: string;
}

/** The playground's folders: drag a file from one to another, and the drop does what the controls say. */
@Component({
    imports: [DraggableDirective, DropTargetDirective, LucideFolder],
    templateUrl: "./drag-drop-demo-folders.component.html"
})
export class DragDropDemoFoldersComponent {
    protected readonly folders = signal<readonly Folder[]>([
        { files: ["notes.txt", "photo.jpg", "report.pdf"], name: "Desktop" },
        { files: [], name: "Archive" },
        { files: [], name: "Shared" }
    ]);

    public readonly dropDisabled = input(false, { transform: booleanAttribute });
    public readonly dropEffect = input<DropEffect>("move");

    /** The target only says what was dropped and how; the folders change here. */
    protected onDrop(event: DropTargetEvent<string>): void {
        const { file, from } = event.drag.data as DraggedFile;
        if (event.effect === "move" && event.target === from) {
            return;
        }
        this.folders.update(folders =>
            folders.map(folder => {
                if (folder.name === event.target) {
                    const name =
                        event.effect === "link"
                            ? `${file} - Shortcut`
                            : event.effect === "copy"
                              ? `${file} - Copy`
                              : file;
                    return { ...folder, files: [...folder.files, uniqueName(folder.files, name)] };
                }
                if (folder.name === from && event.effect === "move") {
                    return { ...folder, files: folder.files.filter(other => other !== file) };
                }
                return folder;
            })
        );
    }
}

/** The name, or the name with a number after it when the folder has one already. */
function uniqueName(files: readonly string[], name: string): string {
    let candidate = name;
    for (let number = 2; files.includes(candidate); number++) {
        candidate = `${name} (${number})`;
    }
    return candidate;
}
