import { Component, computed, DOCUMENT, inject } from "@angular/core";
import { ColorPickerComponent, ColorPickerValueTemplateDirective } from "@nanahoshi/mona-ui/color-picker";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";
import { editorFontColorPreviewThemeVariants, editorFontColorValueThemeVariants } from "../../styles/editor.styles";
import { htmlColorCode } from "../../utils/htmlColorCode";

@Component({
    selector: "mona-editor-font-color",
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective],
    templateUrl: "./editor-font-color.component.html"
})
export class EditorFontColorComponent {
    readonly #document = inject(DOCUMENT);
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    #lastColor: string = "";
    protected readonly colorPreviewClass = computed(() => {
        return editorFontColorPreviewThemeVariants();
    });
    protected readonly colorValueClass = computed(() => {
        return editorFontColorValueThemeVariants();
    });
    protected readonly selectedColor = computed(() => {
        this.#editorService.state();
        const attributes = this.#editorService.editor.getAttributes("textStyle");
        const color = attributes["color"] || this.#lastColor;
        return htmlColorCode(color, this.#document);
    });

    public onColorChange(color: string | null): void {
        if (color) {
            this.#editorService.editor.chain().focus().setColor(color).run();
            this.#lastColor = color;
        } else {
            this.#editorService.editor.chain().focus().unsetColor().run();
        }
    }
}
