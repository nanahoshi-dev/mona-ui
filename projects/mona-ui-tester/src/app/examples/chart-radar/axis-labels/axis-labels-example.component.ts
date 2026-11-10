import { Component } from "@angular/core";
import {
    ChartAngularAxisComponent,
    ChartAxisLabelTemplateDirective,
    ChartComponent,
    ChartRadialAxisComponent,
    ChartTooltipComponent,
    RadarSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAxisFormatter } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-radar-axis-labels-example",
    imports: [
        ChartAngularAxisComponent,
        ChartAxisLabelTemplateDirective,
        ChartComponent,
        ChartRadialAxisComponent,
        ChartTooltipComponent,
        RadarSeriesComponent
    ],
    templateUrl: "./axis-labels-example.component.html"
})
export class ChartRadarAxisLabelsExampleComponent {
    protected readonly coverage = [
        { area: "Components", value: 92 },
        { area: "Directives", value: 81 },
        { area: "Services", value: 74 },
        { area: "Pipes", value: 96 },
        { area: "Utilities", value: 67 }
    ];
    protected readonly percent: ChartAxisFormatter = value => `${value}%`;
}
