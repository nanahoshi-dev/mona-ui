import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ChartLineAreaDemoComponent } from "../../../demo/components/chart-line-area-demo/chart-line-area-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, ChartLineAreaDemoComponent, MarkdownDocComponent],
    selector: "app-chart-line-area-doc",
    templateUrl: "./chart-line-area-doc.component.html"
})
export class ChartLineAreaDocComponent {}
