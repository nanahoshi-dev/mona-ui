import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-list",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-list.component.html"
})
export class EditorListComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
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
