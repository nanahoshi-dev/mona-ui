import { Component } from "@angular/core";
import {
    CandlestickSeriesComponent,
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent
} from "@nanahoshi/mona-ui/chart";

interface PriceRow {
    readonly average: number | null;
    readonly close: number;
    readonly date: Date;
    readonly high: number;
    readonly low: number;
    readonly open: number;
}

const AVERAGE_DAYS = 20;

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

/** About six months of weekdays: a random walk with each row's 20-day moving average of the close. */
function createPrices(): readonly PriceRow[] {
    const rows: PriceRow[] = [];
    let close = 96;
    for (let offset = 0; rows.length < 120; offset++) {
        const date = new Date(2026, 0, 5 + offset);
        if (date.getDay() === 0 || date.getDay() === 6) {
            continue;
        }
        const index = rows.length;
        const open = round(close + Math.sin(index * 1.3) * 0.6);
        close = round(open + Math.sin(index / 9) * 1.5 + Math.cos(index * 2.1) * 1.1 + 0.08);
        const high = round(Math.max(open, close) + 0.4 + Math.abs(Math.sin(index)) * 0.9);
        const low = round(Math.min(open, close) - 0.4 - Math.abs(Math.cos(index)) * 0.9);
        const recent = [...rows.slice(-(AVERAGE_DAYS - 1)).map(row => row.close), close];
        const average =
            recent.length === AVERAGE_DAYS ? round(recent.reduce((sum, value) => sum + value, 0) / AVERAGE_DAYS) : null;
        rows.push({ average, close, date, high, low, open });
    }
    return rows;
}

@Component({
    selector: "app-chart-financial-moving-average-example",
    imports: [
        CandlestickSeriesComponent,
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent
    ],
    templateUrl: "./moving-average-example.component.html"
})
export class ChartMovingAverageExampleComponent {
    protected readonly prices = createPrices();
}
