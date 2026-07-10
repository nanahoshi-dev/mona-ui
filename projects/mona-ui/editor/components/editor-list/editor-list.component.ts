import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-list",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-list.component.html"
})
export class EditorListComponent {
    readonly #editorService: EditorService = inject(EditorService);
    protected readonly orderedListSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive("orderedList");
    });
    protected readonly unorderedListSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive("bulletList");
    });

    public onOrderedListToggle(): void {
        this.#editorService.editor.chain().focus().toggleOrderedList().run();
    }

    public onUnorderedListToggle(): void {
        this.#editorService.editor.chain().focus().toggleBulletList().run();
    }
}
