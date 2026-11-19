import { Component } from "@angular/core";
import { SparklineComponent } from "@nanahoshi/mona-ui/sparkline";

@Component({
    selector: "app-sparkline-types-example",
    imports: [SparklineComponent],
    templateUrl: "./types-example.component.html"
})
export class SparklineTypesExampleComponent {
    protected readonly results = [1, 1, -1, 0, 1, -1, -1, 1, 1, 0, 1, 1];
    protected readonly revenueChange = [4, 7, -2, 5, 9, -6, 3, 8, -3, 6];
    protected readonly signUps = [12, 15, 14, 22, 28, 24, 31, 36, 33, 41];
    protected readonly visitors = [320, 410, 380, 520, 490, 610, 580, 720, 690, 840];
}
