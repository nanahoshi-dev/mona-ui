import { Component } from "@angular/core";
import {
    AreaSeriesComponent,
    ChartComponent,
    ChartTooltipComponent,
    ChartTooltipTemplateDirective,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-tooltip-example",
    imports: [
        AreaSeriesComponent,
        ChartComponent,
        ChartTooltipComponent,
        ChartTooltipTemplateDirective,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    templateUrl: "./tooltip-example.component.html"
})
export class ChartTooltipExampleComponent {
    protected readonly usage = [
        { day: "Mon", downloads: 320, uploads: 140 },
        { day: "Tue", downloads: 410, uploads: 180 },
        { day: "Wed", downloads: 380, uploads: 210 },
        { day: "Thu", downloads: 520, uploads: 190 },
        { day: "Fri", downloads: 610, uploads: 260 },
        { day: "Sat", downloads: 290, uploads: 120 },
        { day: "Sun", downloads: 240, uploads: 90 }
    ];

    protected gigabytes = (value: unknown): string => `${String(value)} GB`;
}
