import { Component } from "@angular/core";
import {
    CandlestickSeriesComponent,
    ChartComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAxisFormatter } from "@nanahoshi/mona-ui/chart";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

@Component({
    selector: "app-chart-financial-candlestick-example",
    imports: [
        CandlestickSeriesComponent,
        ChartComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    templateUrl: "./candlestick-example.component.html"
})
export class ChartCandlestickExampleComponent {
    protected readonly prices = [
        { date: new Date(2026, 2, 2), open: 182.1, high: 185.4, low: 181.2, close: 184.9 },
        { date: new Date(2026, 2, 3), open: 184.9, high: 186.2, low: 182.7, close: 183.1 },
        { date: new Date(2026, 2, 4), open: 183.4, high: 184.0, low: 179.8, close: 180.2 },
        { date: new Date(2026, 2, 5), open: 180.0, high: 182.9, low: 179.5, close: 182.5 },
        { date: new Date(2026, 2, 6), open: 182.5, high: 183.6, low: 181.1, close: 182.5 },
        { date: new Date(2026, 2, 9), open: 183.0, high: 187.8, low: 182.6, close: 187.1 },
        { date: new Date(2026, 2, 10), open: 187.3, high: 189.5, low: 186.4, close: 188.8 },
        { date: new Date(2026, 2, 11), open: 188.6, high: 189.0, low: 184.3, close: 185.0 },
        { date: new Date(2026, 2, 12), open: 185.2, high: 186.1, low: 183.0, close: 183.6 },
        { date: new Date(2026, 2, 13), open: 183.8, high: 187.2, low: 183.5, close: 186.7 }
    ];
    protected readonly dollars: ChartAxisFormatter = value => usd.format(Number(value));
}
