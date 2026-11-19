import { Component } from "@angular/core";
import { SparklineComponent } from "@nanahoshi/mona-ui/sparkline";

@Component({
    selector: "app-sparkline-curves-example",
    imports: [SparklineComponent],
    templateUrl: "./curves-example.component.html"
})
export class SparklineCurvesExampleComponent {
    protected readonly orders = [14, 22, 18, 30, 26, 41, 35, 38, 52, 47];
    protected readonly plan = [10, 10, 10, 25, 25, 25, 25, 50, 50, 50];
}
