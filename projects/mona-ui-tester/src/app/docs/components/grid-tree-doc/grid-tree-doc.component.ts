import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { GridTreeDemoComponent } from "../../../demo/components/grid-tree-demo/grid-tree-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, GridTreeDemoComponent, MarkdownDocComponent],
    selector: "app-grid-tree-doc",
    templateUrl: "./grid-tree-doc.component.html"
})
export class GridTreeDocComponent {}
