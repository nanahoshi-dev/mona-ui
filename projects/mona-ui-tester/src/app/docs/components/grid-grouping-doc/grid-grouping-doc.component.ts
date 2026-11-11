import { Component } from "@angular/core";
import { GridGroupingDemoComponent } from "../../../demo/components/grid-grouping-demo/grid-grouping-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [GridGroupingDemoComponent, MarkdownDocComponent],
    selector: "app-grid-grouping-doc",
    templateUrl: "./grid-grouping-doc.component.html"
})
export class GridGroupingDocComponent {}
