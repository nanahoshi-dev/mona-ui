import { Component } from "@angular/core";
import {
    ChartCenterTemplateDirective,
    ChartComponent,
    ChartLegendComponent,
    DonutSeriesComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-pie-donut-example",
    imports: [ChartCenterTemplateDirective, ChartComponent, ChartLegendComponent, DonutSeriesComponent],
    templateUrl: "./donut-example.component.html"
})
export class ChartDonutExampleComponent {
    protected readonly sources = [
        { category: "Search", value: 4200 },
        { category: "Direct", value: 2600 },
        { category: "Social", value: 1500 },
        { category: "Email", value: 900 }
    ];
}
