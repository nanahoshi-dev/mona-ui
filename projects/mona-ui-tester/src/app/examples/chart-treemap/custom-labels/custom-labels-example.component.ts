import { PercentPipe } from "@angular/common";
import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartTooltipComponent,
    ChartTreemapLabelTemplateDirective,
    TreemapSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-treemap-custom-labels-example",
    imports: [
        ChartComponent,
        ChartTooltipComponent,
        ChartTreemapLabelTemplateDirective,
        PercentPipe,
        TreemapSeriesComponent
    ],
    templateUrl: "./custom-labels-example.component.html"
})
export class ChartTreemapCustomLabelsExampleComponent {
    protected readonly colors = ["#1d4ed8", "#0f766e", "#6d28d9"];
    protected readonly disk = [
        {
            name: "Media",
            children: [
                { name: "Videos", size: 48 },
                { name: "Photos", size: 31 },
                { name: "Music", size: 12 }
            ]
        },
        {
            name: "Projects",
            children: [
                { name: "node_modules", size: 22, color: "#b91c1c" },
                { name: "Builds", size: 9 },
                { name: "Sources", size: 4 }
            ]
        },
        {
            name: "System",
            children: [
                { name: "Applications", size: 26 },
                { name: "Caches", size: 7 },
                { name: "Logs", size: 2 }
            ]
        }
    ];
    protected readonly gigabytes: ChartValueFormatter = value => `${value} GB`;
}
