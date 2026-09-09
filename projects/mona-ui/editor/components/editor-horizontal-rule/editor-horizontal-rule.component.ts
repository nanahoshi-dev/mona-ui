import { Component, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-horizontal-rule",
    imports: [ButtonDirective],
    templateUrl: "./editor-horizontal-rule.component.html"
})
export class EditorHorizontalRuleComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);

    public onHorizontalRuleClick(): void {
        this.#editorService.editor.chain().focus().setHorizontalRule().run();
    }
}
