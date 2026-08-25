import { Component } from "@angular/core";
import { ChartDemoComponent } from "../../../demo/components/chart-demo/chart-demo.component";
import { ChartSyncDensityDemoComponent } from "../../../demo/components/chart-sync-density-demo/chart-sync-density-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ChartDemoComponent, ChartSyncDensityDemoComponent, MarkdownDocComponent],
    selector: "app-chart-doc",
    templateUrl: "./chart-doc.component.html"
})
export class ChartDocComponent {}
