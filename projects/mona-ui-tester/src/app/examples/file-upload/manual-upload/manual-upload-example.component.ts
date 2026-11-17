import { Component } from "@angular/core";
import { FileUploadComponent, type FileUploadHandler } from "@nanahoshi/mona-ui/file-upload";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

/** Stands in for a server that takes about a second and a half per file. */
const simulatedUpload: FileUploadHandler = (_file, { progress, signal }) =>
    new Promise<void>(resolve => {
        let step = 0;
        const timer = setInterval(() => {
            progress(++step, 6);
            if (step === 6) {
                clearInterval(timer);
                resolve();
            }
        }, 250);
        signal.addEventListener("abort", () => clearInterval(timer));
    });

@Component({
    selector: "app-file-upload-manual-upload-example",
    imports: [FileUploadComponent, FormFieldComponent],
    templateUrl: "./manual-upload-example.component.html"
})
export class FileUploadManualUploadExampleComponent {
    protected readonly upload = simulatedUpload;
}
