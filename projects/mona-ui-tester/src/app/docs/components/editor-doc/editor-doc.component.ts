import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { EditorDemoComponent } from "../../../demo/components/editor-demo/editor-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-editor-doc",
    imports: [ApiSectionComponent, EditorDemoComponent, MarkdownDocComponent],
    templateUrl: "./editor-doc.component.html"
})
export class EditorDocComponent {}
