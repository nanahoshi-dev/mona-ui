import { Component, signal } from "@angular/core";
import { EditorComponent } from "@nanahoshi/mona-ui/editor";
import type { FileUploadHandler } from "@nanahoshi/mona-ui/file-upload";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

/**
 * Stands in for a server: it takes about a second per image, and returns an address the page can show. A real server
 * returns the address it stored the image at.
 */
function simulatedImageServer(): FileUploadHandler {
    return (file, { progress, signal }) =>
        new Promise<string>((resolve, reject) => {
            let step = 0;
            const timer = setInterval(() => {
                step++;
                progress(step, 5);
                if (step === 5) {
                    clearInterval(timer);
                    resolve(URL.createObjectURL(file));
                }
            }, 200);
            signal.addEventListener("abort", () => {
                clearInterval(timer);
                reject(signal.reason);
            });
        });
}

@Component({
    selector: "app-editor-image-upload-example",
    imports: [EditorComponent, FormFieldComponent],
    templateUrl: "./image-upload-example.component.html"
})
export class EditorImageUploadExampleComponent {
    protected readonly maxFileSize = 2 * 1024 * 1024;
    protected readonly notes = signal("<p>Paste a screenshot here.</p>");
    protected readonly upload = simulatedImageServer();
}
