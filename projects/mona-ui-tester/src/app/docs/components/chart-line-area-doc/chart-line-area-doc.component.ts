import { Component } from "@angular/core";
import { ChartLineAreaDemoComponent } from "../../../demo/components/chart-line-area-demo/chart-line-area-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ChartLineAreaDemoComponent, MarkdownDocComponent],
    selector: "app-chart-line-area-doc",
    templateUrl: "./chart-line-area-doc.component.html"
})
export class ChartLineAreaDocComponent {}
