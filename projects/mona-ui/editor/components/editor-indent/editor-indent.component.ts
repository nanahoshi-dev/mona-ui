import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-indent",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-indent.component.html"
})
export class EditorIndentComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly indentDisabled = computed(() => {
        this.#editorService.state();
        return !this.#editorService.editor.can().indent();
    });
    protected readonly outdentDisabled = computed(() => {
        this.#editorService.state();
        return !this.#editorService.editor.can().outdent();
    });

    public onIndentClick(): void {
        this.#editorService.editor.chain().focus().indent().run();
    }

    public onOutdentClick(): void {
        this.#editorService.editor.chain().focus().outdent().run();
    }
}
