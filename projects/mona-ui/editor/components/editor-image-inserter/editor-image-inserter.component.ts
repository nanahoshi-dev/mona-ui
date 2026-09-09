import { Component, computed, inject, output, signal } from "@angular/core";
import { form, FormField, FormRoot, maxLength, required } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorImageInsertEvent } from "../../models/EditorImageInsertEvent";
import type { ImageInsertFormModel } from "../../models/ImageInsertFormModel";
import {
    editorImageInserterActionsThemeVariants,
    editorImageInserterFormThemeVariants,
    editorImageInserterRowLabelThemeVariants,
    editorImageInserterRowThemeVariants
} from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-image-inserter",
    imports: [TextBoxComponent, ButtonDirective, NumericTextBoxComponent, FormRoot, FormField],
    templateUrl: "./editor-image-inserter.component.html"
})
export class EditorImageInserterComponent {
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    readonly #imageFormModel = signal<ImageInsertFormModel>({
        alt: "",
        height: null,
        link: "",
        width: null
    });
    protected readonly actionsClass = computed(() => {
        return editorImageInserterActionsThemeVariants();
    });
    protected readonly formClass = computed(() => {
        return editorImageInserterFormThemeVariants();
    });
    protected readonly iForm = form(this.#imageFormModel, schema => {
        required(schema.link);
        maxLength(schema.link, 2048);
    });
    protected readonly rowClass = computed(() => {
        return editorImageInserterRowThemeVariants();
    });
    protected readonly rowLabelClass = computed(() => {
        return editorImageInserterRowLabelThemeVariants();
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
