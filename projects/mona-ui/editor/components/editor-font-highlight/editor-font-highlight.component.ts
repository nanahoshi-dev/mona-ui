import { Component, computed, inject } from "@angular/core";
import { ColorPickerComponent, ColorPickerValueTemplateDirective } from "@nanahoshi/mona-ui/color-picker";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";
import {
    editorFontHighlightPreviewThemeVariants,
    editorFontHighlightValueThemeVariants
} from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-font-highlight",
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective],
    templateUrl: "./editor-font-highlight.component.html"
})
export class EditorFontHighlightComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    #lastColor: string = "";
    protected readonly highlightPreviewClass = computed(() => {
        return editorFontHighlightPreviewThemeVariants();
    });
    protected readonly highlightValueClass = computed(() => {
        return editorFontHighlightValueThemeVariants();
    });
    protected readonly selectedColor = computed(() => {
        const state = this.#editorService.state();
        if (state.selection.empty) {
            const marks = state.storedMarks || state.selection.$from.marks();
            const highlightMark = marks.find(mark => mark.type.name === "highlight");
            return highlightMark ? highlightMark.attrs["color"] : this.#lastColor;
        } else {
            const node = state.doc.nodeAt(state.selection.from);
            if (node) {
                const highlightMark = node.marks.find(mark => mark.type.name === "highlight");
                return highlightMark ? highlightMark.attrs["color"] : this.#lastColor;
            }
            return "";
        }
    });

    public onColorChange(color: string | null): void {
        if (color) {
            this.#editorService.editor.chain().focus().setHighlight({ color }).run();
            this.#lastColor = color;
        } else {
            this.#editorService.editor.chain().focus().unsetHighlight().run();
        }
    }
}
