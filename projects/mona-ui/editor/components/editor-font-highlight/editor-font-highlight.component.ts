import { Component, computed, inject } from "@angular/core";
import { ColorPickerComponent, ColorPickerValueTemplateDirective } from "@nanahoshi/mona-ui/color-picker";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { EditorService } from "../../services/editor.service";
import { EDITOR_STYLE_STRATEGY } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-font-highlight",
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective],
    templateUrl: "./editor-font-highlight.component.html"
})
export class EditorFontHighlightComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #styleStrategy = inject(EDITOR_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    #lastColor: string = "";
    protected readonly highlightPreviewClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).fontHighlightPreview();
    });
    protected readonly highlightValueClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).fontHighlightValue();
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
