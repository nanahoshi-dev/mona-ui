import { Component } from "@angular/core";
import { SparklineComponent } from "@nanahoshi/mona-ui/sparkline";

@Component({
    selector: "app-sparkline-reference-example",
    imports: [SparklineComponent],
    templateUrl: "./reference-example.component.html"
})
export class SparklineReferenceExampleComponent {
    protected readonly milliseconds: Intl.NumberFormatOptions = { style: "unit", unit: "millisecond" };
    protected readonly responseTimes = [172, 168, 181, 195, 214, 231, 208, 193, 188, 179, 191, 186];
}
