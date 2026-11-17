import { Component, signal } from "@angular/core";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { FileUploadComponent, type FileUploadHandler, type FileUploadItem } from "@nanahoshi/mona-ui/file-upload";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

interface StoredFile {
    readonly id: string;
    readonly name: string;
}

/** Stands in for a server: it takes about two seconds per file, and fails while `offline()` is true. */
function simulatedServer(offline: () => boolean): FileUploadHandler {
    return (file, { progress, signal }) =>
        new Promise<StoredFile>((resolve, reject) => {
            let step = 0;
            const timer = setInterval(() => {
                step++;
                progress(step, 10);
                if (offline() && step === 4) {
                    clearInterval(timer);
                    reject(new Error("The server didn't answer."));
                } else if (step === 10) {
                    clearInterval(timer);
                    resolve({ id: crypto.randomUUID().slice(0, 8), name: file.name });
                }
            }, 200);
            signal.addEventListener("abort", () => clearInterval(timer));
        });
}

@Component({
    selector: "app-file-upload-upload-example",
    imports: [CheckBoxComponent, FileUploadComponent, FormFieldComponent],
    templateUrl: "./upload-example.component.html"
})
export class FileUploadUploadExampleComponent {
    protected readonly offline = signal(false);
    protected readonly stored = signal<readonly StoredFile[]>([]);
    protected readonly upload = simulatedServer(() => this.offline());

    protected onRemove(item: FileUploadItem): void {
        // An uploaded file comes with what the upload returned, here its id, to delete it from the server.
        const removed = item.response as StoredFile | null;
        this.stored.update(stored => stored.filter(file => file.id !== removed?.id));
    }

    protected onUploadSuccess(item: FileUploadItem): void {
        this.stored.update(stored => [...stored, item.response as StoredFile]);
    }
}
