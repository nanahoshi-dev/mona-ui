import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-line-area-line-example",
    imports: [ChartComponent, ChartLegendComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent],
    templateUrl: "./line-example.component.html"
})
export class ChartLineExampleComponent {
    protected readonly visitors = [
        { month: "Jan", mobile: 2100, web: 3200 },
        { month: "Feb", mobile: 2400, web: 3100 },
        { month: "Mar", mobile: 2900, web: 3500 },
        { month: "Apr", mobile: 3300, web: 3400 },
        { month: "May", mobile: 3800, web: 3700 },
        { month: "Jun", mobile: 4200, web: 3600 }
    ];
}
