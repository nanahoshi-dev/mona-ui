import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    FunnelSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-funnel-sales-pipeline-example",
    imports: [ChartComponent, ChartLegendComponent, ChartTooltipComponent, FunnelSeriesComponent],
    templateUrl: "./sales-pipeline-example.component.html"
})
export class ChartFunnelSalesPipelineExampleComponent {
    protected readonly pipeline = [
        { deals: 2400, stage: "Leads" },
        { deals: 1250, stage: "Qualified" },
        { deals: 640, stage: "Proposal" },
        { deals: 410, stage: "Negotiation" },
        { deals: 260, stage: "Won" }
    ];
    protected readonly deals: ChartValueFormatter = value => `${Number(value).toLocaleString("en")} deals`;
}
