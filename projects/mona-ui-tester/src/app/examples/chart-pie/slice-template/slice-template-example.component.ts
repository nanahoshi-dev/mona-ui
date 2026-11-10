import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartSliceLabelTemplateDirective,
    ChartTooltipComponent,
    PieSeriesComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-pie-slice-template-example",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartSliceLabelTemplateDirective,
        ChartTooltipComponent,
        PieSeriesComponent
    ],
    templateUrl: "./slice-template-example.component.html"
})
export class ChartPieSliceTemplateExampleComponent {
    protected readonly budget = [
        { amount: 540, color: "#1d4ed8", item: "Salaries" },
        { amount: 210, color: "#047857", item: "Infrastructure" },
        { amount: 150, color: "#b45309", item: "Marketing" },
        { amount: 60, color: "#be185d", item: "Travel" },
        { amount: 40, color: "#6d28d9", item: "Training" }
    ];
}
