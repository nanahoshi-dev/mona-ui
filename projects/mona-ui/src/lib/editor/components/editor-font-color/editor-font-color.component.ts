import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject } from "@angular/core";
import { ColorPickerComponent } from "../../../inputs/color-picker/components/color-picker/color-picker.component";
import { ColorPickerValueTemplateDirective } from "../../../inputs/color-picker/directives/color-picker-value-template.directive";
import { EditorService } from "../../services/editor.service";
import { htmlColorCode } from "../../utils/htmlColorCode";

@Component({
    selector: "mona-editor-font-color",
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective],
    templateUrl: "./editor-font-color.component.html",
    styleUrl: "./editor-font-color.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
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
