import { Component, computed, DOCUMENT, inject } from "@angular/core";
import { ColorPickerComponent, ColorPickerValueTemplateDirective } from "@mirei/mona-ui/color-picker";
import { EditorService } from "../../services/editor.service";
import { htmlColorCode } from "../../utils/htmlColorCode";

@Component({
    selector: "mona-editor-font-color",
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective],
    templateUrl: "./editor-font-color.component.html",
    styleUrl: "./editor-font-color.component.scss"
})
export class EditorFontColorComponent {
    readonly #document = inject(DOCUMENT);
    readonly #editorService: EditorService = inject(EditorService);
    #lastColor: string = "";
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
