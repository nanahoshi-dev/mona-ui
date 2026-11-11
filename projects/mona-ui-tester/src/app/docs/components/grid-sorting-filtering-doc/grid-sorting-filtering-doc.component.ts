import { Component } from "@angular/core";
import { GridSortingFilteringDemoComponent } from "../../../demo/components/grid-sorting-filtering-demo/grid-sorting-filtering-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [GridSortingFilteringDemoComponent, MarkdownDocComponent],
    selector: "app-grid-sorting-filtering-doc",
    templateUrl: "./grid-sorting-filtering-doc.component.html"
})
export class GridSortingFilteringDocComponent {}
