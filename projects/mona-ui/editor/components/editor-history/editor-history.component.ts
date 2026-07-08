import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { ButtonGroupComponent } from "@mirei/mona-ui/button-group";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-history",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-history.component.html",
    styleUrl: "./editor-history.component.scss"
})
export class EditorHistoryComponent {
    readonly #editorService: EditorService = inject(EditorService);
    protected readonly redoDisabled = computed(() => {
        this.#editorService.state();
        return !this.#editorService.editor.can().redo();
    });
    protected readonly undoDisabled = computed(() => {
        this.#editorService.state();
        return !this.#editorService.editor.can().undo();
    });

    public onRedoClick(): void {
        this.#editorService.editor.chain().focus().redo().run();
    }

    public onUndoClick(): void {
        this.#editorService.editor.chain().focus().undo().run();
    }
}
