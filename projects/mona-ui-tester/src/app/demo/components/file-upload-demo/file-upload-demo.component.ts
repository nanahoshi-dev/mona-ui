import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, input, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required, requiredError, validate } from "@angular/forms/signals";
import { type FileUploadContext, FileUploadComponent, type FileUploadHandler } from "@nanahoshi/mona-ui/file-upload";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

/** Stands in for a server: about two seconds per file. */
const simulatedUpload: FileUploadHandler = (_file: File, { progress, signal }: FileUploadContext) =>
    new Promise<void>(resolve => {
        let step = 0;
        const timer = setInterval(() => {
            progress(++step, 10);
            if (step === 10) {
                clearInterval(timer);
                resolve();
            }
        }, 200);
        signal.addEventListener("abort", () => clearInterval(timer));
    });

function numberOrNull(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const UPLOADS: readonly { text: string; value: FileUploadHandler | null }[] = [
    { text: "None: pick files only", value: null },
    { text: "Simulated server", value: simulatedUpload }
];

const FILE_SIZES: readonly { text: string; value: number | null }[] = [
    { text: "No limit", value: null },
    { text: "100 kB", value: 100 * 1024 },
    { text: "1 MB", value: 1024 * 1024 },
    { text: "5 MB", value: 5 * 1024 * 1024 }
];

@Component({
    selector: "app-file-upload-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./file-upload-demo.component.html"
})
export class FileUploadDemoComponent extends AbstractDemoComponent<FileUploadComponent> {
    protected readonly config = computed<ComponentConfig<FileUploadComponent>>(() => ({
        inputs: deriveInputConfig<FileUploadComponent>(this.metadata(), {
            accept: {
                type: "dropdown",
                value: ["", "image/*", ".pdf,.docx", ".png,.jpg,.jpeg"],
                defaultValue: ""
            },
            // The demo names the upload with a form field around it.
            ariaDescribedBy: undefined,
            ariaLabel: undefined,
            ariaLabelledBy: undefined,
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
            maxFileSize: {
                type: "customDropdown",
                value: FILE_SIZES,
                textField: "text",
                valueField: "value",
                defaultValue: null
            },
            maxFiles: {
                type: "number",
                nullable: true,
                min: 1,
                max: 10,
                value: null
            },
            minFileSize: undefined,
            upload: {
                type: "customDropdown",
                value: UPLOADS,
                textField: "text",
                valueField: "value",
                defaultValue: simulatedUpload
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("FileUploadComponent");
    protected readonly wrapperComponent = FileUploadWrapperComponent;
}

@Component({
    imports: [FileUploadComponent, FormField, FormFieldComponent],
    templateUrl: "./file-upload-demo-wrapper.component.html",
    host: {
        class: "w-full max-w-md"
    }
})
class FileUploadWrapperComponent implements ComponentInputsAsSignal<FileUploadComponent> {
    readonly #model = signal<{ files: File[] }>({ files: [] });
    protected readonly attachment = form(this.#model, path => {
        disabled(path.files, { when: () => this.disabled() });
        readonly(path.files, { when: () => this.readonly() });
        required(path.files, { when: () => this.required() });
        // Signal Forms' required doesn't count an empty list as missing, so this reports it.
        validate(path.files, ({ value }) => (this.required() && value().length === 0 ? requiredError() : undefined));
    });
    protected readonly hint = computed(() =>
        this.upload() == null
            ? "The files are kept for the form to send."
            : "Each file uploads as it's added, and the value holds the uploaded ones."
    );
    public readonly accept = input<ReturnType<FileUploadComponent["accept"]>>("");
    public readonly autoUpload = input(true, { transform: booleanAttribute });
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly maxFileSize = input<number | null, unknown>(null, { transform: numberOrNull });
    public readonly maxFiles = input<number | null, unknown>(null, { transform: numberOrNull });
    public readonly multiple = input(true, { transform: booleanAttribute });
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly upload = input<ReturnType<FileUploadComponent["upload"]>>(simulatedUpload);
    public readonly userClass = input<ReturnType<FileUploadComponent["userClass"]>>("");
}
