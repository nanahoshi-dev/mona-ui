import { Component } from "@angular/core";
import { ChartBarDemoComponent } from "../../../demo/components/chart-bar-demo/chart-bar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ChartBarDemoComponent, MarkdownDocComponent],
    selector: "app-chart-bar-doc",
    templateUrl: "./chart-bar-doc.component.html"
})
export class ChartBarDocComponent {}
