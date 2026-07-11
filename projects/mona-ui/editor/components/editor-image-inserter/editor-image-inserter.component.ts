import { Component, computed, inject, output, signal } from "@angular/core";
import { form, FormField, FormRoot, maxLength, required } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { EditorImageInsertEvent } from "../../models/EditorImageInsertEvent";
import type { ImageInsertFormModel } from "../../models/ImageInsertFormModel";
import { EDITOR_STYLE_STRATEGY } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-image-inserter",
    imports: [TextBoxComponent, ButtonDirective, NumericTextBoxComponent, FormRoot, FormField],
    templateUrl: "./editor-image-inserter.component.html"
})
export class EditorImageInserterComponent {
    readonly #imageFormModel = signal<ImageInsertFormModel>({
        alt: "",
        height: null,
        link: "",
        width: null
    });
    readonly #styleStrategy = inject(EDITOR_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly actionsClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).imageInserterActions();
    });
    protected readonly formClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).imageInserterForm();
    });
    protected readonly iForm = form(this.#imageFormModel, schema => {
        required(schema.link);
        maxLength(schema.link, 2048);
    });
    protected readonly rowClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).imageInserterRow();
    });
    protected readonly rowLabelClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).imageInserterRowLabel();
    });

    public readonly cancel = output();
    public readonly insert = output<EditorImageInsertEvent>();

    protected onCancel(): void {
        this.cancel.emit();
    }

    protected onImageInsert(): void {
        this.insert.emit({
            alt: this.iForm.alt().value(),
            height: this.iForm.height().value(),
            link: this.iForm.link().value(),
            width: this.iForm.width().value()
        });
    }
}
