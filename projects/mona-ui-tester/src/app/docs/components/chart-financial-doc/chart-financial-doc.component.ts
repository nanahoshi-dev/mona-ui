import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ChartFinancialDemoComponent } from "../../../demo/components/chart-financial-demo/chart-financial-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, ChartFinancialDemoComponent, MarkdownDocComponent],
    selector: "app-chart-financial-doc",
    templateUrl: "./chart-financial-doc.component.html"
})
export class ChartFinancialDocComponent {}
