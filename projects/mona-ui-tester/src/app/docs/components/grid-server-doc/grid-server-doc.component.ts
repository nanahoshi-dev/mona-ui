import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { GridServerDemoComponent } from "../../../demo/components/grid-server-demo/grid-server-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, GridServerDemoComponent, MarkdownDocComponent],
    selector: "app-grid-server-doc",
    templateUrl: "./grid-server-doc.component.html"
})
export class GridServerDocComponent {}
