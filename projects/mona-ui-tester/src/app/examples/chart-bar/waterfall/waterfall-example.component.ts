import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartWaterfallLabelTemplateDirective,
    ChartXAxisComponent,
    ChartYAxisComponent,
    WaterfallSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartWaterfallDatumKind } from "@nanahoshi/mona-ui/chart";

interface ProfitStep {
    readonly amount?: number;
    readonly kind: ChartWaterfallDatumKind;
    readonly step: string;
}

@Component({
    selector: "app-chart-bar-waterfall-example",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartWaterfallLabelTemplateDirective,
        ChartXAxisComponent,
        ChartYAxisComponent,
        WaterfallSeriesComponent
    ],
    templateUrl: "./waterfall-example.component.html"
})
export class ChartWaterfallExampleComponent {
    protected readonly profit: readonly ProfitStep[] = [
        { amount: 420, kind: "change", step: "Revenue" },
        { amount: -168, kind: "change", step: "Cost of sales" },
        { kind: "subtotal", step: "Gross profit" },
        { amount: -64, kind: "change", step: "Marketing" },
        { amount: -112, kind: "change", step: "Salaries" },
        { amount: 18, kind: "change", step: "Other income" },
        { kind: "subtotal", step: "Operating profit" },
        { amount: -23, kind: "change", step: "Tax" },
        { kind: "total", step: "Net profit" }
    ];

    protected readonly thousands = (value: unknown): string => {
        const amount = Number(value);
        return `${amount < 0 ? "-" : ""}$${Math.abs(amount)}k`;
    };
}
