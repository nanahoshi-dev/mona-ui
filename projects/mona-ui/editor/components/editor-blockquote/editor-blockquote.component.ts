import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-blockquote",
    imports: [ButtonDirective],
    templateUrl: "./editor-blockquote.component.html"
})
export class EditorBlockquoteComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly blockquoteSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive("blockquote");
    });

    public onBlockquoteToggle(): void {
        if (this.blockquoteSelected()) {
            this.#editorService.editor.chain().focus().unsetBlockquote().run();
        } else {
            this.#editorService.editor.chain().focus().setBlockquote().run();
        }
    }
}
