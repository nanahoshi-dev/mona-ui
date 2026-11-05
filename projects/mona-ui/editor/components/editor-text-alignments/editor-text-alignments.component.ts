import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EditorPressedDirective } from "../../directives/editor-pressed.directive";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

type TextAlignment = "center" | "end" | "justify" | "start";

/**
 * Aligns paragraphs and headings to the start or end of the line, so the buttons mean the same in right-to-left text.
 * Content with a physical `left` or `right` alignment (from older HTML) shows as start or end in the current
 * direction.
 */
@Component({
    selector: "mona-editor-text-alignments",
    imports: [ButtonGroupComponent, ButtonDirective, EditorPressedDirective],
    templateUrl: "./editor-text-alignments.component.html"
})
export class EditorTextAlignmentsComponent {
    readonly #alignment = computed<TextAlignment | null>(() => {
        this.#editorService.state();
        const editor = this.#editorService.editor;
        const rtl = this.#direction() === "rtl";
        if (editor.isActive({ textAlign: "center" })) {
            return "center";
        }
        if (editor.isActive({ textAlign: "justify" })) {
            return "justify";
        }
        if (editor.isActive({ textAlign: "start" }) || editor.isActive({ textAlign: rtl ? "right" : "left" })) {
            return "start";
        }
        if (editor.isActive({ textAlign: "end" }) || editor.isActive({ textAlign: rtl ? "left" : "right" })) {
            return "end";
        }
        return null;
    });
    readonly #direction = injectComponentDirection();
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly alignCenterSelected = computed(() => this.#alignment() === "center");
    protected readonly alignEndSelected = computed(() => this.#alignment() === "end");
    protected readonly alignJustifySelected = computed(() => this.#alignment() === "justify");
    protected readonly alignStartSelected = computed(() => this.#alignment() === "start");
    protected readonly endIcon = computed(() => (this.#direction() === "rtl" ? "ri-align-left" : "ri-align-right"));
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly startIcon = computed(() => (this.#direction() === "rtl" ? "ri-align-right" : "ri-align-left"));

    public onAlignCenter(): void {
        this.#toggle("center");
    }

    public onAlignEnd(): void {
        this.#toggle("end");
    }

    public onAlignJustify(): void {
        this.#toggle("justify");
    }

    public onAlignStart(): void {
        this.#toggle("start");
    }

    #toggle(alignment: TextAlignment): void {
        const chain = this.#editorService.editor.chain().focus();
        if (this.#alignment() === alignment) {
            chain.unsetTextAlign().run();
        } else {
            chain.setTextAlign(alignment).run();
        }
    }
}
