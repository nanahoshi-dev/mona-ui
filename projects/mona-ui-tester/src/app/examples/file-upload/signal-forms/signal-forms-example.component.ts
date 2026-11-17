import { Component, signal } from "@angular/core";
import { form, FormField, required, requiredError, submit, validate } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { FileUploadComponent, type FileUploadHandler } from "@nanahoshi/mona-ui/file-upload";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

interface ExpenseClaim {
    receipts: File[];
}

/** Stands in for a server that takes about a second per file. */
const simulatedUpload: FileUploadHandler = (_file, { progress, signal }) =>
    new Promise<void>(resolve => {
        let step = 0;
        const timer = setInterval(() => {
            progress(++step, 5);
            if (step === 5) {
                clearInterval(timer);
                resolve();
            }
        }, 200);
        signal.addEventListener("abort", () => clearInterval(timer));
    });

@Component({
    selector: "app-file-upload-signal-forms-example",
    imports: [ButtonDirective, FileUploadComponent, FormField, FormFieldComponent],
    templateUrl: "./signal-forms-example.component.html"
})
export class FileUploadSignalFormsExampleComponent {
    readonly #model = signal<ExpenseClaim>({ receipts: [] });
    protected readonly claim = form(this.#model, path => {
        required(path.receipts);
        // Signal Forms' required doesn't count an empty list as missing, so this reports it.
        validate(path.receipts, ({ value }) => (value().length === 0 ? requiredError() : undefined));
    });
    protected readonly sent = signal(false);
    protected readonly upload = simulatedUpload;

    protected onSubmit(event: Event): void {
        event.preventDefault();
        void submit(this.claim, async () => {
            this.sent.set(true);
        });
    }
}
