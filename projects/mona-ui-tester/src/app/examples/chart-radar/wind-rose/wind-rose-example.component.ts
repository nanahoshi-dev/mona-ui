import { Component } from "@angular/core";
import {
    ChartAngularAxisComponent,
    ChartComponent,
    ChartRadialAxisComponent,
    ChartTooltipComponent,
    PolarSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAxisFormatter, ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

@Component({
    selector: "app-chart-radar-wind-rose-example",
    imports: [
        ChartAngularAxisComponent,
        ChartComponent,
        ChartRadialAxisComponent,
        ChartTooltipComponent,
        PolarSeriesComponent
    ],
    templateUrl: "./wind-rose-example.component.html"
})
export class ChartRadarWindRoseExampleComponent {
    /** The average wind every 45 degrees, from north, clockwise. */
    protected readonly wind = [
        { bearing: 0, speed: 9 },
        { bearing: 45, speed: 7 },
        { bearing: 90, speed: 6 },
        { bearing: 135, speed: 8 },
        { bearing: 180, speed: 13 },
        { bearing: 225, speed: 19 },
        { bearing: 270, speed: 22 },
        { bearing: 315, speed: 15 }
    ];
    protected readonly compass: ChartAxisFormatter = value => COMPASS[Math.round(Number(value) / 45) % COMPASS.length];
    protected readonly kmh: ChartValueFormatter = value => `${value} km/h`;
}
