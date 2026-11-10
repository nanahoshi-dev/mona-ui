import { Component, signal } from "@angular/core";
import {
    CandlestickSeriesComponent,
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    OhlcSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";

type PriceSeriesType = "candlestick" | "ohlc";

@Component({
    selector: "app-chart-financial-direction-colors-example",
    imports: [
        CandlestickSeriesComponent,
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        OhlcSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./direction-colors-example.component.html"
})
export class ChartDirectionColorsExampleComponent {
    protected readonly prices = [
        { week: "Week 1", open: 41.2, high: 43.8, low: 40.6, close: 43.1 },
        { week: "Week 2", open: 43.1, high: 44.0, low: 41.0, close: 41.5 },
        { week: "Week 3", open: 41.5, high: 42.2, low: 38.9, close: 39.4 },
        { week: "Week 4", open: 39.4, high: 41.7, low: 39.0, close: 41.2 },
        { week: "Week 5", open: 41.2, high: 42.0, low: 40.4, close: 41.2 },
        { week: "Week 6", open: 41.4, high: 45.3, low: 41.1, close: 44.9 },
        { week: "Week 7", open: 44.9, high: 46.2, low: 43.8, close: 45.6 },
        { week: "Week 8", open: 45.6, high: 45.9, low: 42.7, close: 43.0 }
    ];
    protected readonly type = signal<PriceSeriesType>("candlestick");
    protected readonly types: readonly SegmentedOption<PriceSeriesType>[] = [
        { label: "Candlestick", value: "candlestick" },
        { label: "OHLC", value: "ohlc" }
    ];

    protected onTypeChange(type: PriceSeriesType | null): void {
        if (type) {
            this.type.set(type);
        }
    }
}
