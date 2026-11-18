import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ToolbarDemoComponent } from "../../../demo/components/toolbar-demo/toolbar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-toolbar-doc",
    imports: [ApiSectionComponent, ToolbarDemoComponent, MarkdownDocComponent],
    templateUrl: "./toolbar-doc.component.html"
})
export class ToolbarDocComponent {}
