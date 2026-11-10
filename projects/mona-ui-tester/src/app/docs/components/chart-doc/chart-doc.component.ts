import { Component } from "@angular/core";
import { ChartOverviewDemoComponent } from "../../../demo/components/chart-overview-demo/chart-overview-demo.component";
import { ChartSyncDensityDemoComponent } from "../../../demo/components/chart-sync-density-demo/chart-sync-density-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ChartOverviewDemoComponent, ChartSyncDensityDemoComponent, MarkdownDocComponent],
    selector: "app-chart-doc",
    templateUrl: "./chart-doc.component.html"
})
export class ChartDocComponent {}
