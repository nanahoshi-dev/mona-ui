import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ChartScatterDemoComponent } from "../../../demo/components/chart-scatter-demo/chart-scatter-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, ChartScatterDemoComponent, MarkdownDocComponent],
    selector: "app-chart-scatter-doc",
    templateUrl: "./chart-scatter-doc.component.html"
})
export class ChartScatterDocComponent {}
