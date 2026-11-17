import { Component, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { FileUploadComponent, formatFileSize } from "@nanahoshi/mona-ui/file-upload";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";

@Component({
    selector: "app-file-upload-basic-example",
    imports: [ButtonDirective, FileUploadComponent, FormFieldComponent],
    templateUrl: "./basic-example.component.html"
})
export class FileUploadBasicExampleComponent {
    readonly #i18n = inject(MonaI18nService);
    protected readonly attachments = signal<File[]>([]);
    protected readonly sent = signal("");

    protected onSubmit(event: Event): void {
        event.preventDefault();
        const files = this.attachments();
        // The files go with the rest of the form, as a multipart request would send them.
        const body = new FormData();
        for (const file of files) {
            body.append("attachments", file);
        }
        const size = formatFileSize(
            files.reduce((total, file) => total + file.size, 0),
            this.#i18n.localeId()
        );
        this.sent.set(`Ready to send ${files.length} ${files.length === 1 ? "file" : "files"}, ${size} in all.`);
    }
}
