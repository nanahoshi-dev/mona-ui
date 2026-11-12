import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ChartRadialDemoComponent } from "../../../demo/components/chart-radial-demo/chart-radial-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, ChartRadialDemoComponent, MarkdownDocComponent],
    selector: "app-chart-radial-doc",
    templateUrl: "./chart-radial-doc.component.html"
})
export class ChartRadialDocComponent {}
