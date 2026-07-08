import { Component, inject } from "@angular/core";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-horizontal-rule",
    imports: [ButtonDirective],
    templateUrl: "./editor-horizontal-rule.component.html",
    styleUrl: "./editor-horizontal-rule.component.scss"
})
export class EditorHorizontalRuleComponent {
    readonly #editorService: EditorService = inject(EditorService);

    public onHorizontalRuleClick(): void {
        this.#editorService.editor.chain().focus().setHorizontalRule().run();
    }
}
