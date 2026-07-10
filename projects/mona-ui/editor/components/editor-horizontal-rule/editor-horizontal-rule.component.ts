import { Component, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-horizontal-rule",
    imports: [ButtonDirective],
    templateUrl: "./editor-horizontal-rule.component.html"
})
export class EditorHorizontalRuleComponent {
    readonly #editorService: EditorService = inject(EditorService);

    public onHorizontalRuleClick(): void {
        this.#editorService.editor.chain().focus().setHorizontalRule().run();
    }
}
