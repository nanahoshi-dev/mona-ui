import { Component, computed, inject } from "@angular/core";
import { ColorPickerComponent, ColorPickerValueTemplateDirective } from "@nanahoshi/mona-ui/color-picker";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";
import {
    editorFontHighlightPreviewThemeVariants,
    editorFontHighlightValueThemeVariants
} from "../../styles/editor.styles";
import { selectionMarkAttribute } from "../../utils/selectionMarkAttribute";

@Component({
    selector: "mona-editor-font-highlight",
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective],
    templateUrl: "./editor-font-highlight.component.html"
})
export class EditorFontHighlightComponent {
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly highlightPreviewClass = computed(() => {
        return editorFontHighlightPreviewThemeVariants();
    });
    protected readonly highlightValueClass = computed(() => {
        return editorFontHighlightValueThemeVariants();
    });
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly selectedColor = computed(() => {
        const state = this.#editorService.state();
        return state ? selectionMarkAttribute(state, "highlight", "color") : null;
    });

    public onColorChange(color: string | null): void {
        if (color) {
            this.#editorService.editor.chain().focus().setHighlight({ color }).run();
        } else {
            this.#editorService.editor.chain().focus().unsetHighlight().run();
        }
    }
}
