import { Component } from "@angular/core";
import { GridOverviewDemoComponent } from "../../../demo/components/grid-overview-demo/grid-overview-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [GridOverviewDemoComponent, MarkdownDocComponent],
    selector: "app-grid-doc",
    templateUrl: "./grid-doc.component.html"
})
export class GridDocComponent {}
