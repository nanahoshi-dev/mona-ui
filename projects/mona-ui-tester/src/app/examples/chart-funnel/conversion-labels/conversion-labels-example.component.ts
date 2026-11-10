import { DecimalPipe } from "@angular/common";
import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartFunnelLabelTemplateDirective,
    ChartTooltipComponent,
    FunnelSeriesComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-funnel-conversion-labels-example",
    imports: [
        ChartComponent,
        ChartFunnelLabelTemplateDirective,
        ChartTooltipComponent,
        DecimalPipe,
        FunnelSeriesComponent
    ],
    templateUrl: "./conversion-labels-example.component.html"
})
export class ChartFunnelConversionLabelsExampleComponent {
    protected readonly checkout = [
        { sessions: 8600, step: "Cart" },
        { sessions: 5900, step: "Shipping" },
        { sessions: 4700, step: "Payment" },
        { sessions: 4100, step: "Review" },
        { sessions: 3800, step: "Paid" }
    ];
}
