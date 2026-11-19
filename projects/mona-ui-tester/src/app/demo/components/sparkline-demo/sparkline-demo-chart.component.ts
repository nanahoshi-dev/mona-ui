import { booleanAttribute, Component, input } from "@angular/core";
import {
    type SparklineCurve,
    type SparklineMarker,
    SparklineComponent,
    type SparklineType
} from "@nanahoshi/mona-ui/sparkline";
import type { ComponentInputsAsSignal } from "../../utils/componentConfig";

/** The playground's sparkline: a shop's profit over two weeks, in a sentence, with losing days below zero. */
@Component({
    imports: [SparklineComponent],
    templateUrl: "./sparkline-demo-chart.component.html"
})
export class SparklineDemoChartComponent implements ComponentInputsAsSignal<SparklineComponent> {
    protected readonly currency: Intl.NumberFormatOptions = {
        currency: "USD",
        maximumFractionDigits: 0,
        style: "currency"
    };
    protected readonly profit = [120, 180, -40, 90, 220, -80, 150, 300, -120, 60, 190, 250, -30, 140];

    public readonly color = input("");
    public readonly curve = input<SparklineCurve>("linear");
    public readonly decorative = input(false, { transform: booleanAttribute });
    public readonly markers = input<readonly SparklineMarker[]>([]);
    public readonly max = input<number | null>(null);
    public readonly min = input<number | null>(null);
    public readonly negativeColor = input("");
    public readonly referenceValue = input<number | null>(null);
    public readonly type = input<SparklineType>("line");
    public readonly userClass = input("");
}
