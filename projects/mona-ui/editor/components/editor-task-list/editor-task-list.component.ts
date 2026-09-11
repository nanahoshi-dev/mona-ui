import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-task-list",
    imports: [ButtonDirective],
    templateUrl: "./editor-task-list.component.html"
})
export class EditorTaskListComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly taskSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive("taskItem");
    });

    public onTaskToggle(): void {
        this.#editorService.editor.chain().focus().toggleTaskList().run();
    }
}
