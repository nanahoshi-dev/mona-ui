import { Component } from "@angular/core";
import { ChartFinancialDemoComponent } from "../../../demo/components/chart-financial-demo/chart-financial-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ChartFinancialDemoComponent, MarkdownDocComponent],
    selector: "app-chart-financial-doc",
    templateUrl: "./chart-financial-doc.component.html"
})
export class ChartFinancialDocComponent {}
