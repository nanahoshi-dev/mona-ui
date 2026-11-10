import { Component } from "@angular/core";
import {
    ChartAnnotationComponent,
    ChartComponent,
    ChartCrosshairComponent,
    ChartReferenceBandComponent,
    ChartReferenceLineComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-overlays-example",
    imports: [
        ChartAnnotationComponent,
        ChartComponent,
        ChartCrosshairComponent,
        ChartReferenceBandComponent,
        ChartReferenceLineComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent
    ],
    templateUrl: "./overlays-example.component.html"
})
export class ChartOverlaysExampleComponent {
    protected readonly latency = [
        { hour: "00:00", ms: 120 },
        { hour: "04:00", ms: 98 },
        { hour: "08:00", ms: 180 },
        { hour: "12:00", ms: 260 },
        { hour: "16:00", ms: 210 },
        { hour: "20:00", ms: 150 }
    ];
}
