import { Component } from "@angular/core";
import { GridEditingDemoComponent } from "../../../demo/components/grid-editing-demo/grid-editing-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [GridEditingDemoComponent, MarkdownDocComponent],
    selector: "app-grid-editing-doc",
    templateUrl: "./grid-editing-doc.component.html"
})
export class GridEditingDocComponent {}
