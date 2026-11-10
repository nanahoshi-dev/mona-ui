import { Component } from "@angular/core";
import { ChartComponent, ChartTooltipComponent, PieSeriesComponent } from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-pie-outside-labels-example",
    imports: [ChartComponent, ChartTooltipComponent, PieSeriesComponent],
    templateUrl: "./outside-labels-example.component.html"
})
export class ChartPieOutsideLabelsExampleComponent {
    protected readonly browsers = [
        { browser: "Chrome", views: 61200 },
        { browser: "Safari", views: 18400 },
        { browser: "Edge", views: 9800 },
        { browser: "Firefox", views: 6100 },
        { browser: "Other", views: 4500 }
    ];
    protected readonly views: ChartValueFormatter = value => `${Number(value).toLocaleString("en")} views`;
}
