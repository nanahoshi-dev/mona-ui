import { Component } from "@angular/core";
import {
    BubbleSeriesComponent,
    ChartComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAxisFormatter, ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

@Component({
    selector: "app-chart-scatter-bubble-example",
    imports: [BubbleSeriesComponent, ChartComponent, ChartTooltipComponent, ChartXAxisComponent, ChartYAxisComponent],
    templateUrl: "./bubble-example.component.html"
})
export class ChartScatterBubbleExampleComponent {
    /** Rounded figures for illustration: income in US dollars, population in millions. */
    protected readonly countries = [
        { country: "Brazil", income: 8900, lifeExpectancy: 73.4, population: 215 },
        { country: "China", income: 12700, lifeExpectancy: 78.6, population: 1412 },
        { country: "Ethiopia", income: 1000, lifeExpectancy: 65, population: 123 },
        { country: "Germany", income: 48700, lifeExpectancy: 80.7, population: 84 },
        { country: "India", income: 2400, lifeExpectancy: 67.7, population: 1417 },
        { country: "Indonesia", income: 4800, lifeExpectancy: 67.6, population: 276 },
        { country: "Japan", income: 34000, lifeExpectancy: 84.5, population: 125 },
        { country: "Mexico", income: 11500, lifeExpectancy: 70.2, population: 128 },
        { country: "Nigeria", income: 2200, lifeExpectancy: 52.7, population: 218 },
        { country: "United States", income: 76300, lifeExpectancy: 77.5, population: 333 }
    ];
    protected readonly dollars: ChartAxisFormatter = value => `$${compact.format(Number(value))}`;
    protected readonly people: ChartValueFormatter = value => `${value} million people`;
    protected readonly years: ChartValueFormatter = value => `${value} years`;
}
