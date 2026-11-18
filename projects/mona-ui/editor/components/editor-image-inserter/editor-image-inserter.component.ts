import { Component, computed, effect, inject, input, isDevMode, output, signal, untracked } from "@angular/core";
import { form, FormField, FormRoot, maxLength, required } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { type FileUploadHandler, type FileUploadItem, FileUploadComponent } from "@nanahoshi/mona-ui/file-upload";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
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
    imports: [TextBoxComponent, ButtonDirective, FileUploadComponent, NumericTextBoxComponent, FormRoot, FormField],
    templateUrl: "./editor-image-inserter.component.html"
})
export class EditorImageInserterComponent {
    readonly #i18n = inject(MonaI18nService);
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
    protected readonly labelIds = {
        alt: createElementControlId(),
        height: createElementControlId(),
        link: createElementControlId(),
        width: createElementControlId()
    };
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly rowClass = computed(() => {
        return editorImageInserterRowThemeVariants();
    });
    protected readonly rowLabelClass = computed(() => {
        return editorImageInserterRowLabelThemeVariants();
    });

    /** The image files the upload takes, as an `accept` attribute. */
    public readonly accept = input("image/*");

    /** The image the form edits, which fills it in, or null when it adds one. */
    public readonly image = input<ImageInsertFormModel | null>(null);
    public readonly insert = output<EditorImageInsertEvent>();
    public readonly insertCancel = output();

    /** The largest image file the upload takes, in bytes. */
    public readonly maxFileSize = input<number | null>(null);

    /** Uploads an image file and returns its address. Without it, the form only takes an address. */
    public readonly upload = input<FileUploadHandler | null>(null);

    public constructor() {
        effect(() => {
            const image = this.image();
            if (image) {
                untracked(() => this.#imageFormModel.set({ ...image }));
            }
        });
    }

    protected onCancel(): void {
        this.insertCancel.emit();
    }

    protected onImageInsert(): void {
        this.insert.emit({
            alt: this.iForm.alt().value(),
            height: this.iForm.height().value(),
            link: this.iForm.link().value(),
            width: this.iForm.width().value()
        });
    }

    /** Puts the uploaded image's address in the address field. */
    protected onUploadSuccess(item: FileUploadItem): void {
        if (typeof item.response === "string" && item.response !== "") {
            this.iForm.link().value.set(item.response);
        } else if (isDevMode()) {
            console.warn(
                "[Mona Editor] imageUpload should return the image's address as a string, but it returned:",
                item.response
            );
        }
    }
}
