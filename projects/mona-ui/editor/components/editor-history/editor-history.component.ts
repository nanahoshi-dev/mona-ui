import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-history",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-history.component.html"
})
export class EditorHistoryComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
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
