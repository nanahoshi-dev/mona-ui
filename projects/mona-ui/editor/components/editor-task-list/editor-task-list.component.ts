import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-task-list",
    imports: [ButtonDirective],
    templateUrl: "./editor-task-list.component.html",
    styleUrl: "./editor-task-list.component.scss"
})
export class EditorTaskListComponent {
    readonly #editorService: EditorService = inject(EditorService);
    protected readonly taskSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive("taskItem");
    });

    public onTaskToggle(): void {
        this.#editorService.editor.chain().focus().toggleTaskList().run();
    }
}
