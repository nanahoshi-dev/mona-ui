import { Component, computed, inject } from "@angular/core";
import { ColorPickerComponent, ColorPickerValueTemplateDirective } from "@nanahoshi/mona-ui/color-picker";
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
