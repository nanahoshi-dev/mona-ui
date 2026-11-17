import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { FileUploadDemoComponent } from "../../../demo/components/file-upload-demo/file-upload-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-file-upload-doc",
    imports: [ApiSectionComponent, FileUploadDemoComponent, MarkdownDocComponent],
    templateUrl: "./file-upload-doc.component.html"
})
export class FileUploadDocComponent {}
