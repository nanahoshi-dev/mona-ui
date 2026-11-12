import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ChartHeatmapDemoComponent } from "../../../demo/components/chart-heatmap-demo/chart-heatmap-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, ChartHeatmapDemoComponent, MarkdownDocComponent],
    selector: "app-chart-heatmap-doc",
    templateUrl: "./chart-heatmap-doc.component.html"
})
export class ChartHeatmapDocComponent {}
