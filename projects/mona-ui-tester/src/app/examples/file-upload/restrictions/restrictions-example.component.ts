import { Component, signal } from "@angular/core";
import { FileUploadComponent } from "@nanahoshi/mona-ui/file-upload";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

@Component({
    selector: "app-file-upload-restrictions-example",
    imports: [FileUploadComponent, FormFieldComponent],
    templateUrl: "./restrictions-example.component.html"
})
export class FileUploadRestrictionsExampleComponent {
    protected readonly maxFileSize = 2 * 1024 * 1024;
    protected readonly photos = signal<File[]>([]);
}
