import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    TreemapSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

const dollars = new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency"
});

@Component({
    selector: "app-chart-treemap-budget-example",
    imports: [ChartComponent, ChartLegendComponent, ChartTooltipComponent, TreemapSeriesComponent],
    templateUrl: "./budget-example.component.html"
})
export class ChartTreemapBudgetExampleComponent {
    protected readonly budget = [
        {
            name: "Engineering",
            children: [
                { name: "Platform", value: 1840000 },
                { name: "Mobile", value: 1260000 },
                { name: "Web", value: 1120000 },
                { name: "Data", value: 960000 }
            ]
        },
        {
            name: "Sales",
            children: [
                { name: "Enterprise", value: 1380000 },
                { name: "Mid-market", value: 860000 },
                { name: "Partnerships", value: 420000 }
            ]
        },
        {
            name: "Marketing",
            children: [
                { name: "Growth", value: 720000 },
                { name: "Brand", value: 640000 },
                { name: "Events", value: 380000 }
            ]
        },
        {
            name: "Operations",
            children: [
                { name: "Facilities", value: 520000 },
                { name: "People", value: 460000 },
                { name: "Finance", value: 410000 }
            ]
        }
    ];
    protected readonly dollars: ChartValueFormatter = value => dollars.format(Number(value));
}
