import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ChartPieDemoComponent } from "../../../demo/components/chart-pie-demo/chart-pie-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, ChartPieDemoComponent, MarkdownDocComponent],
    selector: "app-chart-pie-doc",
    templateUrl: "./chart-pie-doc.component.html"
})
export class ChartPieDocComponent {}
