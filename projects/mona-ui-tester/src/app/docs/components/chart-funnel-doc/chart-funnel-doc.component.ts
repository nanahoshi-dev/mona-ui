import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ChartFunnelDemoComponent } from "../../../demo/components/chart-funnel-demo/chart-funnel-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, ChartFunnelDemoComponent, MarkdownDocComponent],
    selector: "app-chart-funnel-doc",
    templateUrl: "./chart-funnel-doc.component.html"
})
export class ChartFunnelDocComponent {}
