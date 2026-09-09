import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-text-alignments",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-text-alignments.component.html"
})
export class EditorTextAlignmentsComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly alignCenterSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive({ textAlign: "center" });
    });
    protected readonly alignJustifySelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive({ textAlign: "justify" });
    });
    protected readonly alignLeftSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive({ textAlign: "left" });
    });
    protected readonly alignRightSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive({ textAlign: "right" });
    });

    public onAlignCenter(): void {
        if (this.alignCenterSelected()) {
            this.#editorService.editor.chain().focus().unsetTextAlign().run();
        } else {
            this.#editorService.editor.chain().focus().setTextAlign("center").run();
        }
    }

    public onAlignJustify(): void {
        if (this.alignJustifySelected()) {
            this.#editorService.editor.chain().focus().unsetTextAlign().run();
        } else {
            this.#editorService.editor.chain().focus().setTextAlign("justify").run();
        }
    }

    public onAlignLeft(): void {
        if (this.alignLeftSelected()) {
            this.#editorService.editor.chain().focus().unsetTextAlign().run();
        } else {
            this.#editorService.editor.chain().focus().setTextAlign("left").run();
        }
    }

    public onAlignRight(): void {
        if (this.alignRightSelected()) {
            this.#editorService.editor.chain().focus().unsetTextAlign().run();
        } else {
            this.#editorService.editor.chain().focus().setTextAlign("right").run();
        }
    }
}
