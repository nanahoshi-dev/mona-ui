import { Component } from "@angular/core";
import { ChartRadarDemoComponent } from "../../../demo/components/chart-radar-demo/chart-radar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ChartRadarDemoComponent, MarkdownDocComponent],
    selector: "app-chart-radar-doc",
    templateUrl: "./chart-radar-doc.component.html"
})
export class ChartRadarDocComponent {}
