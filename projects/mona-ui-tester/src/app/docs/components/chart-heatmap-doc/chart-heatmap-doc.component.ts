import { Component } from "@angular/core";
import { ChartHeatmapDemoComponent } from "../../../demo/components/chart-heatmap-demo/chart-heatmap-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ChartHeatmapDemoComponent, MarkdownDocComponent],
    selector: "app-chart-heatmap-doc",
    templateUrl: "./chart-heatmap-doc.component.html"
})
export class ChartHeatmapDocComponent {}
