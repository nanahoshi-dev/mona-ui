import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";
import { EditorPressedDirective } from "../../directives/editor-pressed.directive";

@Component({
    selector: "mona-editor-code-block",
    imports: [ButtonDirective, EditorPressedDirective],
    templateUrl: "./editor-code-block.component.html"
})
export class EditorCodeBlockComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly codeBlockSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive("codeBlock");
    });
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);

    public onCodeBlockClick(): void {
        this.#editorService.editor.chain().focus().toggleCodeBlock().run();
    }
}
