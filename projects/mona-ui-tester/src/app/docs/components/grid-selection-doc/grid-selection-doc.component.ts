import { Component } from "@angular/core";
import { GridSelectionDemoComponent } from "../../../demo/components/grid-selection-demo/grid-selection-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [GridSelectionDemoComponent, MarkdownDocComponent],
    selector: "app-grid-selection-doc",
    templateUrl: "./grid-selection-doc.component.html"
})
export class GridSelectionDocComponent {}
