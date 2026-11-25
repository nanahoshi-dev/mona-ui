import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DragDropDemoComponent } from "../../../demo/components/drag-drop-demo/drag-drop-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-drag-drop-doc",
    imports: [ApiSectionComponent, DragDropDemoComponent, MarkdownDocComponent],
    templateUrl: "./drag-drop-doc.component.html"
})
export class DragDropDocComponent {}
