import { Component } from "@angular/core";
import { ChartTreemapDemoComponent } from "../../../demo/components/chart-treemap-demo/chart-treemap-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ChartTreemapDemoComponent, MarkdownDocComponent],
    selector: "app-chart-treemap-doc",
    templateUrl: "./chart-treemap-doc.component.html"
})
export class ChartTreemapDocComponent {}
