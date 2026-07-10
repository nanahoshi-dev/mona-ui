import { Component, computed, DOCUMENT, inject } from "@angular/core";
import { ColorPickerComponent, ColorPickerValueTemplateDirective } from "@nanahoshi/mona-ui/color-picker";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
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
    readonly #themeService = inject(ThemeService);
    #lastColor: string = "";
    protected readonly colorPreviewClass = computed(() => {
        const theme = this.#themeService.theme();
        return editorFontColorPreviewThemeVariants(theme)();
    });
    protected readonly colorValueClass = computed(() => {
        const theme = this.#themeService.theme();
        return editorFontColorValueThemeVariants(theme)();
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
